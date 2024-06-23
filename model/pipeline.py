import torchvision.transforms as transforms
import math
import pandas as pd
import numpy as np
import cv2
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import matplotlib.patches as patches
import supervision as sv
import os
import numpy as np
import pandas as pd
import csv

from io import BytesIO
from PIL import Image
from pathlib import Path
from ultralytics import YOLO
from collections import defaultdict
from sklearn.cluster import DBSCAN

class CG_Pipeline():
    def __init__(self, fps, corners, interval_speed_calculation):
      self.corner_points_arr = corners
      self.fps = fps
      #instantiate the yolo model for person detection

      self.model = YOLO("yolov8n.pt")

      #set class_id to zero to only get person boundary boxes
      self.class_id = 0

      # instantiate the tracker for tracking people
      self.byte_tracker = sv.ByteTrack()  # Assuming byte_tracker is part of tracker initialization
      #annotator to blur bboxes identified
      self.blur_annotator = sv.BlurAnnotator()

      #variables for getting speed estimate:
      self.interval_speed_calculation = interval_speed_calculation
      self.frames_per_interval = interval_speed_calculation * fps

      #coords is the list of bbox coordinates of the current frame
      self.coords = defaultdict(list)

      #speeds is the speed of the labeled bbox
      self.speeds = defaultdict(int)


    #calculate the scale factor for converting pixels to cm
    def calculate_scale_factor(self, boxes_ref) :
      # Global average height of person: Women ~ 162 cm | Men ~ 175 cm (https://www.dryukselyurttas.com/post/average-height-men-and-women)
      # (162 + 175) / 2 = 168.5 cm
      global_average_height = (162 + 175) / 2

      # unzip the boundary box coordinates separated by xmin, ymin, width and height of the boxes
      _, _, _, height = zip(*boxes_ref)

      # average height of pixel dimensions
      H_avg = sum(height) / len(height)

      # scale factor cm/pixels
      scale_factor = global_average_height / H_avg
      return scale_factor


    # Function to transform points + get the bottom most point of the bounding boxes
    def transform_points(self, boxes, matrix):
      bottom_points = []
      transformed_bottom_points = []
      for box in boxes:
        pnts = [int(box[0] + (box[2] * 0.5)), int(box[1] + box[3])]
        bottom_points.append(pnts)
        points = np.array([[pnts]], dtype="float32")
        trans_pnts = cv2.perspectiveTransform(points, matrix)[0][0]
        pnt = [int(trans_pnts[0]), int(trans_pnts[1])]
        transformed_bottom_points.append(pnt)
      return bottom_points, transformed_bottom_points

    #draw a graph showing a bird's eye view of the selected region
    def bird_eye_view(self, frame, df, color_label_dict):
      h,w = frame.shape[0],frame.shape[1]
      blank_image = np.zeros((int(h), int(w), 3), np.uint8)
      white = (255, 255, 255)
      blank_image[:] = white

      for _, person in df.iterrows():
        x, y = person['transformed_bottom_points']
        center = (int(x),int(y))
        color = color_label_dict[person['labels']]
        color = [int(255 * c) for c in color[:3]]

        blank_image = cv2.circle(blank_image, center, 5, color=color, thickness=10)

      return blank_image

    # Function to calculate distance
    def calculate_distance(self, p1, p2, scale_factor):
      h = abs(p2[1] - p1[1])
      v = abs(p2[0] - p1[0])
      dist_v = float(v * scale_factor)
      dist_h = float(h * scale_factor)
      return int(np.sqrt((dist_h ** 2) + (dist_v ** 2)))

    # Function to calculate distance between bottom points of people after converting to cm
    def convert_distance_calculation(self, bottom_points, scale_factor):
      distance_matrix_dbscan = []
      for i in range(len(bottom_points)):
        row_distance = []
        for j in range(len(bottom_points)):
          if i != j:
              dist = self.calculate_distance(bottom_points[i], bottom_points[j], scale_factor)
              row_distance.append(dist)
          else:
              row_distance.append(0)
        distance_matrix_dbscan.append(row_distance)
      return distance_matrix_dbscan

    # estimate the speed of the function
    def speed_estimate(self, latest_coord):
      new_speeds = {}
      coords = self.coords
      for track_id in coords:
        if track_id in latest_coord:
          sub_group = latest_coord[track_id][1]
          pos_curr = np.array(coords[track_id][0])
          pos_latest = np.array(latest_coord[track_id][0])

          # 2 seconds
          time_diff = self.frames_per_interval / self.fps
          displacement = np.linalg.norm(pos_latest - pos_curr)
          speed = displacement / time_diff
          new_speeds[track_id] = [speed, sub_group]
      return latest_coord, new_speeds

    # Get average speed of subgroups
    def get_average_speed_subgroup(self):
      group_speeds = defaultdict(list)
      # Group speeds by subgroup
      for _, (speed, sub_group) in self.speeds.items():
        sub_group_key = int(sub_group)
        group_speeds[sub_group_key].append(speed)

      # Calculate average speed for each subgroup
      average_speeds = {}
      for sub_group, speeds_list in group_speeds.items():
        if speeds_list:
          average_speed = sum(speeds_list) / len(speeds_list)
        else:
          average_speed = 0
        # convert from cm/s^2 to m/s^2
        average_speed = average_speed / 100
        average_speeds[sub_group] = average_speed
      return average_speeds


    # create points on the bottom points of the boundary boxes and color based on label:
    def circle_crowd(self, frame, bboxes_untransformed, color_label_dict, circle_radius):
      for _, person in bboxes_untransformed.iterrows():
        x, y = person['untransformed_bottom_points']
        center = (int(x),int(y))
        color = color_label_dict[person['labels']]
        color = [int(255 * c) for c in color[:3]]

      frame = cv2.circle(frame,center,circle_radius,color=color, thickness=-1)
      return frame

    """
      Data preprocessing for crowd crush risk assessment.
      df: model output dataframe containing crowd density and flow rate
    """    
    def preprocess_model_output(df: pd.DataFrame) -> pd.DataFrame:
      # Only calculate for labels >= 0
      df = df[df["labels"] >= 0]
    
      # Extract speed & density values with error handling for 'e' notation, remove
      df_filtered = df[~df['people_per_m2'].isin(['e'])]
      df_filtered = df_filtered[~df_filtered['speed_per_group'].isin(['e'])]
    
      df_filtered.dropna(inplace=True)
      return df_filtered
        

    """
      Return likelhood of a crowd crush.
      flow rate: m/s
      density: people/m^2
    """
    def assess_crowd_crush_risk(flow_rate: float, density: float) -> int:
      # Thresholds defined based on Moussaid's research image
      congestion_threshold_flow = 1.2
      congestion_threshold_density = 5
      crush_threshold_flow = 0.3
      crush_threshold_density = 7
    
      if flow_rate >= crush_threshold_flow and density >= crush_threshold_density:
        return 2
        # "High Risk - Crowd Crush Likely"
      elif flow_rate >= congestion_threshold_flow and density >= congestion_threshold_density:
        return 1
        # "Medium Risk - Congestion Possible"
      else:
        return 0
        # "Low Risk - Monitor Conditions"'


    """
      Return mode of list of likelhoods.
      Returns -1 if list is empty.
      likelihoods: list of int likelhoods of crowd crush (0~2)
    """
    def get_mode_likelihoods(likelihoods: list[int]) -> int:
      if len(likelihoods) == 0:
          return -1
      elif len(likelihoods) == 2:
          return max(likelihoods)
      else:
          return max(set(likelihoods), key=likelihoods.count)

    """
      Predict crowd crush risk for given image.
      df: model output dataframe containing crowd density and flow rate
    """
    def predict_disaster(df: pd.DataFrame) -> int:
      data = preprocess_model_output(df)
      speed = data['speed_per_group'].iloc[:]
      density = data['people_per_m2'].iloc[:]
    
      likelihoods = []
      for i in range(0, len(speed)):
        likelihoods.append(assess_crowd_crush_risk(speed.iloc[i], density.iloc[i]))
    
      return get_mode_likelihoods(likelihoods)
        

    #label the crowd density + draw boxes around subclusters of points
    def label_crowd_density(self, frame, label_groups, color_label_dict, circle_radius):
      for label, group in label_groups.groupby('labels'):
        if label != -1:
          crowd_density = group['people_per_m2'].iloc[0]
          speed = group['speed_per_group'].iloc[0]
          text_speed = f"S: {speed:.3f}" if isinstance(speed, float) and not math.isnan(speed) else "S: calculating..."

          min_x, min_y, max_x, max_y = group['area_coord_untransformed'].iloc[0]
          min_x =  min_x - circle_radius
          min_y =  min_y - circle_radius
          max_x =  max_x + circle_radius
          max_y =  max_y + circle_radius

          points = np.array([[min_x, min_y], [max_x, min_y], [min_y, max_y], [max_x, max_y]], dtype=np.int32)

          # Reshape the points array to the required shape for cv2.polylines
          points = points.reshape((-1, 1, 2))
          color = color_label_dict[label]
          color = [int(255 * c) for c in color[:3]]

          #form boxes around the subclusters
          cv2.rectangle(frame, (min_x, min_y), (max_x, max_y), color=color, thickness=2)
          cv2.rectangle(frame, (min_x, min_y-25), (max_x, min_y), color=color, thickness=-1)

          # Add text on top of the rectangle
          text_density = f"D: {crowd_density:.3f}"
          cv2.putText(frame, text_density, (min_x, min_y - 15), cv2.FONT_HERSHEY_SIMPLEX, fontScale=0.5, color=(0, 0, 0), thickness=1, lineType=cv2.LINE_AA)
          cv2.putText(frame, text_speed, (min_x, min_y), cv2.FONT_HERSHEY_SIMPLEX, fontScale=0.5, color=(0, 0, 0), thickness=1, lineType=cv2.LINE_AA)
          # cv2.rectangle(frame, (int(min_x), int(min_y)), (int(min_x + t_size[0]), int(min_y + t_size[1])), (colors[label]), -1, cv2.LINE_AA)
      return frame

    #cluster groups based on distance, with labels where -1 is noise and any number >= 0 is a distinct subcluster
    def cluster_groups(self, distance_matrix_dbscan):
      #set eps to 500cm and minimum of 4 people in a group
      eps = 500
      min_samples = 4
      distance_matrix_dbscan = np.array(distance_matrix_dbscan)
      db = DBSCAN(eps=eps, min_samples=min_samples, metric='precomputed')
      db.fit_predict(distance_matrix_dbscan)
      return db.labels_

    #convert matplot axes to images
    def convert_plt_to_image(self, plt):
      buf = BytesIO()
      plt.savefig(buf, format='jpg')
      plt.close()
      buf.seek(0)
      img = Image.open(buf)
      return img

    def calculate_crowd_disaster_potential(self, label_df):
      return 0

    # RUN the actual pipeline
    # perspective transformation code adapted from: https://medium.com/@joicejoseph/monitor-social-distancing-using-python-yolov5-opencv-78d72c675f5b
    def pipeline(self, frame, frame_number):
      # resize if needed, but YOLO works best with original dimensions
      # frame = cv2.resize(frame, (800, 600))
      H, W = frame.shape[:2]
      fontsize = H / 100

      #turn the color of the object to rgb
      frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
      plt.imshow(frame)

      # YOLOV8: track the people and extract the bbox coordinates
      results = self.model.track(frame, persist=True, classes=[0], conf=0.08)[0]


      detections = sv.Detections.from_ultralytics(results)
      detections = self.byte_tracker.update_with_detections(detections)
      # prevent double detection with Non-Maximum Suppression (nms)
      detections = detections.with_nms(threshold=0.5, class_agnostic=False)
      bboxes, ids = [], []
      print(bboxes)


      #for each tracked bbox, change the format of the bbox from min_x, min_y, max_x, max_y to min_x, min_y, width and height
      for track in detections:
        box = list(track[0])
        id = track[4]
        bboxes.append([box[0], box[1], box[2] - box[0], box[3] - box[1]])
        ids.append(id)

      if bboxes:
        print("here")
        #blur the output bboxes
        frame = self.blur_annotator.annotate(
        scene=frame.copy(),
        detections=detections
        )

        #calculate the scale factor with the average size of bboxes
        scale_factor = self.calculate_scale_factor(bboxes)

        img_params = np.float32([[W, 0], [W, H], [0, H], [0, 0]])
        #get perspective transformation matrix with the points
        matrix = cv2.getPerspectiveTransform(self.corner_points_arr, img_params)
        #transform the image with the transformation matrix, visualize img_transformed to see warped image
        img_transformed = cv2.warpPerspective(frame, matrix, (W, H))

        #get the bottom center points of each bbox untransformed and transformed
        bottom_points_untransformed, bottom_points_transformed = self.transform_points(bboxes, matrix)
        bottom_points_transformed = np.array(bottom_points_transformed)

        #change the distance from pixels to cm
        distance_matrix_dbscan = self.convert_distance_calculation(bottom_points_transformed, scale_factor)

        #Perform unsupervised learning to group subclusters of crowds using distance matrix
        labels = self.cluster_groups(distance_matrix_dbscan)


        #make a panda dataframe with the bbox coordinates, bottom points transformed and untransformed, distance matrix, labels
        df = pd.DataFrame(list(zip(bboxes, bottom_points_untransformed, bottom_points_transformed, distance_matrix_dbscan, labels)),
                          columns=['bboxes_untransformed', 'untransformed_bottom_points', 'transformed_bottom_points', 'distance_RL_cm', 'labels'])

        # get the area of the subclusters with min max x y values with untransformed and transformed to get area
        area_coord_untransformed = df.groupby('labels')['untransformed_bottom_points'].apply(lambda row: (min(p[0] for p in row), min(p[1] for p in row), max(p[0] for p in row), max(p[1] for p in row))).reset_index(name='area_coord_untransformed')
        area_coord_transformed = df.groupby('labels')['transformed_bottom_points'].apply(lambda row: (min(p[0] for p in row), min(p[1] for p in row), max(p[0] for p in row), max(p[1] for p in row))).reset_index(name='area_coord_transformed')
        area_df = df.groupby('labels')['transformed_bottom_points'].apply(lambda row: ((max(p[0] for p in row) - min(p[0] for p in row)) * (max(p[1] for p in row) - min(p[1] for p in row)))).reset_index(name='area_transformed')
        # get area in meters
        area_df['area_transformed'] = area_df['area_transformed'] / 100

        #get count of people in each group
        count_df = df.groupby('labels').size().reset_index(name='count')

        #create a label_df that contains the information of each group by merging by label
        label_df = pd.merge(area_df, count_df, on='labels')
        label_df = pd.merge(label_df, area_coord_untransformed, on='labels')
        label_df = pd.merge(label_df, area_coord_transformed, on='labels')

        #calcultate crowd density
        label_df['people_per_m2'] = label_df['count'] / label_df['area_transformed']

        #populate speed with previous speed of that group (updated every 2 seconds)
        label_df['speed_per_group'] = label_df['labels'].map(self.speeds)

        # for every two seconds, get a new speed calculation
        if frame_number % self.frames_per_interval == 0:
          latest_coord = {}
          for id, point, label in zip(ids, bottom_points_transformed, labels):
            latest_coord[id] = (point, label)
          #if it is the second frame, populate with current coordinates of bboxes
          if not self.coords:
            self.coords = latest_coord
          else:
              # if not the second frame, estimate the speed
            self.coords, self.speeds = self.speed_estimate(latest_coord)
            self.speeds = self.get_average_speed_subgroup()
            label_df['speed_per_group'] = label_df['labels'].map(self.speeds)


        unique_labels = np.unique(labels)

        # color palette for coloring different subgroups
        colors = plt.cm.gist_rainbow(np.linspace(0, 1, len(unique_labels)))
        # color dictionary key: labels, value: colors
        color_label_dict = {}

        circle_radius = 5
        fig, ax = plt.subplots()


        # create the color dictionary for each label and plot each of the points on the graph
        for k in unique_labels:
          if k == -1:
            # noise points (-1) are colored grey
            col = [0, 0, 0, 1]  
          else:
            # other labels are neon blue
            col = [0, 0.92391, 1, 1] 
          color_label_dict.update({k:col})
          class_member_mask = (labels == k)
          xy = bottom_points_transformed[class_member_mask]
          ax.plot(xy[:, 0], xy[:, 1], 'o', markerfacecolor=col, markeredgecolor=col, markersize=circle_radius)

        # for each subgroup, draw the area boxes
        for label, col in color_label_dict.items():
          if label != -1:
            row = label_df.loc[label_df['labels'] == label]
            coord_area = row['area_coord_transformed'].values[0]
            min_x, min_y, max_x, max_y = coord_area
            min_x =  min_x - circle_radius
            min_y =  min_y - circle_radius
            max_x =  max_x + circle_radius
            max_y =  max_y + circle_radius
            speed = row['speed_per_group'].values[0]
            density = row['people_per_m2'].values[0]

            ax.text(min_x, min_y-(fontsize*10), f'D: {density:.3f}\nS: {speed:.3f}', fontsize=fontsize, color='black', va='top')
            rect = patches.Rectangle((min_x, min_y), (max_x - min_x), (max_y - min_y), edgecolor=col, facecolor='none')
            rect_label = patches.Rectangle((min_x, min_y-(fontsize*10)), (max_x - min_x), fontsize*10, edgecolor=col, facecolor=col)

            ax.add_patch(rect)
            ax.add_patch(rect_label)

                # Set equal aspect ratio
            ax.set_aspect('equal')

            # Adjust x and y limits to fit the content
            ax.set_xlim(-W, W)
            ax.set_ylim(-H, H)

            # Invert y-axis to get a view similar to the original image
            ax.invert_yaxis()
            ax.set_yticks(range(-H, H, 100))
            ax.set_yticklabels([-tick for tick in range(-H, H, 100)])

        ax.set_xlabel('X (in meters)')
        ax.set_ylabel('Y (in meters)')
        ax.set_title('Bird Eye View')

        # circle the people in the subgroups with their respective colors
        circled_crowd = self.circle_crowd(frame.copy(), df, color_label_dict, circle_radius)
        labeled_crowd_density = self.label_crowd_density(circled_crowd, label_df,color_label_dict, circle_radius)


        #convert ax to image
        potential_for_crowd_crush = self.predict_disaster(label_df)
        bird_eye_view_image = self.convert_plt_to_image(plt)
      else:
        ("fere")
        fig, ax = plt.subplots(figsize=(8, 6))

        ax.set_xlim(-W, W)
        ax.set_ylim(-H, H)
        ax.set_xlabel('X (in meters)')
        ax.set_ylabel('Y (in meters)')
        
        ax.set_title('Bird Eye View')

        fig.canvas.draw()

        labeled_crowd_density = frame
      # plt.imshow(frame)
        potential_for_crowd_crush = float("nan")
        bird_eye_view_image = self.convert_plt_to_image(plt)
        

      


      return bird_eye_view_image, labeled_crowd_density, potential_for_crowd_crush

#example of running on one frame:
if __name__ == "__main__":
  video_path = "/home/nazanin/ai4good/CrowdGuard/crowd-guard-app/backend/venv/uploads/simulation 1m2.mp4"
  cap = cv2.VideoCapture(video_path)

  points = [[800, 250],[1280,500], [600, 720], [150,350]]
  corner_points_arr = np.float32(points[:4])

  width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
  height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
  fps = int(cap.get(cv2.CAP_PROP_FPS))

  # Define codec and create VideoWriter object
  output_video_path = '/home/nazanin/ai4good/CrowdGuard/crowd-guard-app/backend/venv/uploads/output_video.avi'
  fourcc = cv2.VideoWriter_fourcc(*'XVID')
  out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

  model = CG_Pipeline(fps=30, corners=corner_points_arr, interval_speed_calculation=2)
 
  frame_number = 1000
  try:
      while cap.isOpened():
          ret, frame = cap.read()
          if not ret:
              break

          frame_number += 1
          bird_eye_view_image, labeled_crowd_density, potential_for_crowd_crush = model.pipeline(frame, frame_number)
          print(f'potential_for_crowd_crush: {potential_for_crowd_crush}')
          out.write(labeled_crowd_density)
          #bird_eye_view_image.save(f'/content/drive/MyDrive/data/Anylogic/simulation_output/bev_{frame_number}.jpg')
  finally:
        cap.release()
        out.release()
        cv2.destroyAllWindows()

# AI4GoodLab 2024 - Team PANDO
![alt text](./images/updated_logo.png)

# Table of Contents
* [Team PANDO](#team-members)
* [Project Description](#project-description)
* [Project Demo](#project-demo)
* [Ethical Considerations](#ethical-considerations)
* [Future Directions](#future-directions)
* [Contact Us](#contact-us)

# <a name="team-members"></a>Team PANDO
* **P**earl Park
* **A**yesha Halim
* **N**azanin Mehregan 
* **D**orothy Lee
* **O**livia Langhorne

# <a name="project-description"></a>Project Description
## The problem:
* Crowd Disaster: A dangerous phenomenon where high-density crowds lead to severe injuries or fatalities due to compressive asphyxia and trampling
* Possibility of crowd disasters are prevalent in large crowd gatherings both indoor and outdoors during events such as concerts or sports, etc.
* Many of these disasters can be prevented by careful planning and intervention by event organizers, governement agencies, etc.

### Q: Is there a way to predict these potential crowd disasters beforehand to avoid these tragedies?
**A: We aimed to predict crowd disaster potentials using surveillance camera footages using crowd density and flow rate within distinct clusters of people**

![alt text](./images/features.png)
![alt text](./images/pipeline_design.png)

# <a name="project-demo"></a>Project Demo
(demo video/images)

# <a name="ethical-considerations"></a>Ethical Considerations
* Usage of global height as scaling factor: there may be bias and inaccuracies with distance measurement in different regions of the world where the average height is much taller or shorter than the global average height used (168.5 cm).
* Based on the accuracy of people detection using yolov8, perhaps the training might detect certain groups of different ethnicity, race, age, etc. much better than others


# <a name="future-directions"></a>Future Directions
* Mobile deployment for public usage
* Interactive maps for indoor, semi-outdoor, and outdoor venues/locations
  *   Better navigation to & visualization of crowd gathering locations & surrounding areas
* Combine behavioral analysis
  *   Influence of emotions => social movements, parades
  *   Movement patterns
* Integrate IoT devices
  *   Sensors for crowd density meters, smart barriers, and wearable devices for attendees => provide additional real-time data 
* Enhanced predictive algorithms
  *   Further image preprocessing techniques to allow for more accurate results on different videos (low resolution, night, day) with the YOLO v8 model
  *   Better scaling factor decision base on objects of known dimensions
  *   If possible, get more info on the orientation of the surveillance camera
 
* Prototype
![alt text](./images/prototype.png)
    

# <a name="contact-us"></a>Contact Us
* If you have any questions or concerns, feel free to contact us via **pandoai4good@gmail.com**!


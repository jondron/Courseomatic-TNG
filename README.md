# Courseomatic
 A javascript app to develop course storyboards. Using a drag and drop interface (with buttons as fallback) you can create 
 - courses, with learning outcomes that are mappable to program learning outcomes
 - programs (only used to get program learning outcomes - you cannot yet create multiple courses for one program within the interface)
 - units
 - activities - these are the main elements of the system, represented as cards that can be dragged within and between units.
 - assessments - these are just activities that have been marked as assessments, with special fields for marking hours, pass marks, percentage of total marks

Courseomatic is a single-user app that, on the bright side, needs no backend application server to run: changes are saved locally and can be exported and imported via JSoN files but only one person can work on a course design. Note that the way it works, however, requires it to be run from a webserver: it needs HTTP so it cannot be run directly from the filesystem.

A multi-user version may be developed later but, for now, the assumption is that it will be used by a single course designer, ideally in collaboration with a team, but there is one and only one master copy.

Its purpose is to develop learning designs for courses. You can create courses that contain units that contain learning activities, with a simple graphic display using a card interface to represent each activity.
 Along the way you associate activity learning outcomes with course learning outcomes, estimate study hours, and, if the activity is tagged as an assessment, enter information about that assessment, including anticipated marking hours.

 The app automatically calculates total study hours and total marking hours, shows proportions of time spent on different learning activity types, identifies outcomes that have not yet
 been assessed, and can generate a full course outline that can be used to develop the course itself.
 
 The learning activity types are based on ABC Learning Design activity types, with the addition of reflection and cooperation to better support self-paced study 
 (you don't have to use those if you don't like them).

 To do:
 - add version number to course
 - add prerequisites field to course
 - allow different activity models, e.g. R2D2, Lewin,
 - allow PLOs to be mapped when adding CLOs, not just when editing
 - make program info a popup in course info. Allow results to update course info form
- make units drag and drop
- make multiple select possible to edit multiple activities at once (tricky interface)
- reorderable CLOs and PLOs

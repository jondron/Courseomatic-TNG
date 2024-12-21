# Courseomatic
 A javascript app to develop course storyboards as part of a course design process. Using a drag and drop interface (with buttons as fallback) you can quickly create designs that include:
 - courses, with learning outcomes that are mappable to program learning outcomes
 - units - weeks, or themes, or whatever
 - activities - these are the main elements of the system, represented as cards that can be dragged within and between units.
 - assessments - these are just activities that have been marked as assessments, with special fields for marking hours, pass marks, percentage of total marks

The app provides various forms of assistance with the mechanics of writing a course: for instance, it automatically calculates total study hours and total marking hours, shows proportions of time spent on different learning activity types, and identifies outcomes that have not yet been assessed. It provides some assistance with scheduling and allocation of development tasks. It can generate a variety of reports, including a syllabus and a full course report, as well as a Common Course Cartridge format (.imscc) file for import into a learning management system.

This is a design tool: it is not built to develop course content. It is intended to scaffold the course design process in a way that focuses on what learners will do and how they will learn, rather than what we intend to teach. What we intend to teach is specified in the learning outcomes and in the units (which have titles and descriptions but that are largely specified in terms of learning activities). Assessments are simply another activity type, with fields for weighting, pass mark, optionality, and projected marking time.

 The learning activity types are based on ABC Learning Design activity types, with the addition of reflection and cooperation to better support self-paced study (you don't have to use those if you don't like them).

## Limitations

Courseomatic is a single-user app that, on the bright side, needs no backend application server to run. This is by design: it means it can be deployed on (say) an LMS like Brightspace and needs no special privileges to do so, meaning anyone with editing rights can add it to their course. Changes are saved locally (on the user's machine, by their browser) every 30 seconds, and can be exported and imported via JSoN files should they wish to share it or to work in a different browser or on a different machine, but only one person can work on a given course design at a time. It is, however, possible to merge courses so different people could work on different units (say) and later pull them together.

A multi-user version (or rather, one with the option to be set as multi-user) may be developed later but, for now, the assumption is that it will be used by a single course designer, ideally in collaboration with a team.

 
 ## To do:
- replace textarea with individual entries for resources, with fields for copyright clearance and comments 
- add EDI field to record potential concerns, fixes, etc
- add rubrics, marking criteria, etc
- provide unit and/or activity outcomes
- add option to assign team member to an activity
- add option to clone multiple activities to a different unit
- introduce basic scheduling/task management
- autofill course orientation form
- allow different activity models, e.g. R2D2, Lewin, pure ABC, etc
- make multiple select possible to edit multiple activities at once (tricky interface)
- make multi-user
- BUG FIX: sometimes adding a unit replaces an existing unit instead of adding. It recovers with a window refresh.

# licence: GPL3

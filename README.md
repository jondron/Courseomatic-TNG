# Courseomatic
 A javascript app to develop course storyboards. Using a drag and drop interface (with buttons as fallback) you can create:
 - courses, with learning outcomes that are mappable to program learning outcomes
 - units - weeks, or themes, or whatever
 - activities - these are the main elements of the system, represented as cards that can be dragged within and between units.
 - assessments - these are just activities that have been marked as assessments, with special fields for marking hours, pass marks, percentage of total marks

The app provides various forms of assistance with the mechanics of writing a course: it automatically calculates total study hours and total marking hours, shows proportions of time spent on different learning activity types, identifies outcomes that have not yet been assessed, it can help calculate estimated study hours (for writing and reading) and it can generate a syllabus and a full course report that can be used to develop the course itself.
 
It is intended to scaffold the course design process in a way that focuses on what learners will do and how they will learn, rather than what we intend to teach. What we intend to teach is specified in the learning outcomes and in the units (which have titles and descriptions but that are largely specified in terms of learning activities). Assessments are simply another activity type, with fields for weighting, pass mark, optionality, and projected marking time.

 The learning activity types are based on ABC Learning Design activity types, with the addition of reflection and cooperation to better support self-paced study (you don't have to use those if you don't like them).

## Limitations

Courseomatic is a single-user app that, on the bright side, needs no backend application server to run. This is by design: it means it can be deployed on (say) an LMS like Brightspace and needs no special privileges to do so, meaning anyone with editing rights can add it to their course. Changes are saved locally (on the user's machine, by their browser) every 30 seconds, and can be exported and imported via JSoN files should they wish to share it or to work in a different browser or on a different machine, but only one person can work on a given course design at a time. It is, however, possible to merge courses so different people could work on different units (say) and later pull them together.

A multi-user version (or rather, one with the option to be set as multi-user) may be developed later but, for now, the assumption is that it will be used by a single course designer, ideally in collaboration with a team.

 
 ## To do:
- replace textarea with individual entries for resources, with fields for copyright clearance and comments 
- add EDI field to record potential concerns, fixes, etc
- allow different activity models, e.g. R2D2, Lewin, pure ABC, etc
- make multiple select possible to edit multiple activities at once (tricky interface)
- make multi-user
# licence: GPL3

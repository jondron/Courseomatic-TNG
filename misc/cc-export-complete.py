import json
import uuid
import zipfile
import os
from datetime import datetime
from xml.etree import ElementTree as ET
from xml.dom import minidom
import re
import html

class CourseomaticExporter:
    def __init__(self, json_file):
        if isinstance(json_file, str):
            with open(json_file, 'r', encoding='utf-8') as f:
                self.course_data = json.load(f)
        else:
            self.course_data = json_file
            
        self.ns = {
            'xmlns': "http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1",
            'xmlns:lom': "http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource",
            'xmlns:xsi': "http://www.w3.org/2001/XMLSchema-instance",
            'xmlns:qti': "http://www.imsglobal.org/xsd/imsqti_v2p1",
            'xsi:schemaLocation': "http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p2_v1p0.xsd"
        }

    def prettify(self, elem):
        """Return a pretty-printed XML string for the Element."""
        rough_string = ET.tostring(elem, 'utf-8')
        reparsed = minidom.parseString(rough_string)
        return reparsed.toprettyxml(indent="  ")

    def create_module_meta(self):
        """Create module metadata XML file"""
        module = ET.Element('module')
        
        title = ET.SubElement(module, 'title')
        title.text = self.course_data['course']['name']
        
        description = ET.SubElement(module, 'description')
        description.text = self.course_data['course']['description']
        
        org_info = ET.SubElement(module, 'org_info')
        org_unit = ET.SubElement(org_info, 'org_unit')
        org_unit.text = self.course_data['course'].get('faculty', '')
        
        return self.prettify(module)

    def create_manifest(self):
        """Create the imsmanifest.xml file content"""
        # Create root element with namespaces
        manifest = ET.Element('manifest', 
                            identifier=f"courseomatic_{self.course_data['course']['code'].strip()}",
                            version="1.1",
                            **self.ns)

        # Add metadata
        metadata = ET.SubElement(manifest, 'metadata')
        schema = ET.SubElement(metadata, 'schema')
        schema.text = 'IMS Common Cartridge'
        schemaversion = ET.SubElement(metadata, 'schemaversion')
        schemaversion.text = '1.1.0'

        # Add organizations
        organizations = ET.SubElement(manifest, 'organizations')
        organization = ET.SubElement(organizations, 'organization', 
                                   identifier="courseomatic_org",
                                   structure="rooted-hierarchy")
        
        # Add title
        title = ET.SubElement(organization, 'title')
        title.text = self.course_data['course']['name']

        # Process units as items
        for unit in self.course_data['units']:
            unit_item = ET.SubElement(organization, 'item', 
                                    identifier=f"UNIT_{unit['id']}")
            unit_title = ET.SubElement(unit_item, 'title')
            unit_title.text = unit['title']

            # Process activities in this unit
            unit_activities = [a for a in self.course_data['activities'] 
                             if a['unitId'] == unit['id']]
            for activity in unit_activities:
                activity_item = ET.SubElement(unit_item, 'item',
                                            identifier=f"ACTIVITY_{activity['id']}")
                activity_title = ET.SubElement(activity_item, 'title')
                activity_title.text = activity['title']

        # Add resources
        resources = ET.SubElement(manifest, 'resources')
        self.add_resources(resources)

        return self.prettify(manifest)

    def add_resources(self, resources_elem):
        """Add resource entries to the manifest"""
        # Add module metadata resource
        module_meta_resource = ET.SubElement(resources_elem, 'resource',
                                           identifier="module_meta",
                                           type="course_settings",
                                           href="course_settings/module_meta.xml")
        
        file_elem = ET.SubElement(module_meta_resource, 'file')
        file_elem.set('href', "course_settings/module_meta.xml")

        # Add course info resource
        course_resource = ET.SubElement(resources_elem, 'resource',
                                      identifier="course_info",
                                      type="webcontent",
                                      href="course_info.html")
        
        file_elem = ET.SubElement(course_resource, 'file')
        file_elem.set('href', "course_info.html")

        # Add resources for units
        for unit in self.course_data['units']:
            unit_resource = ET.SubElement(resources_elem, 'resource',
                                        identifier=f"UNIT_{unit['id']}_resource",
                                        type="webcontent",
                                        href=f"units/{unit['id']}.html")
            
            file_elem = ET.SubElement(unit_resource, 'file')
            file_elem.set('href', f"units/{unit['id']}.html")

        # Add resources for activities
        for activity in self.course_data['activities']:
            if activity['isAssessed']:
                # Create assessment resource
                activity_resource = ET.SubElement(resources_elem, 'resource',
                                                identifier=f"ACTIVITY_{activity['id']}_resource",
                                                type="imsqti_xmlv1p2/imscc_xmlv1p1/assessment",
                                                href=f"assessments/{activity['id']}/assessment.xml")
                
                # Add assessment file
                file_elem = ET.SubElement(activity_resource, 'file')
                file_elem.set('href', f"assessments/{activity['id']}/assessment.xml")
                
                # Add metadata file
                metadata_elem = ET.SubElement(activity_resource, 'file')
                metadata_elem.set('href', f"assessments/{activity['id']}/assessment_meta.xml")
            else:
                # Create content resource
                activity_resource = ET.SubElement(resources_elem, 'resource',
                                                identifier=f"ACTIVITY_{activity['id']}_resource",
                                                type="webcontent",
                                                href=f"activities/{activity['id']}.html")
                
                file_elem = ET.SubElement(activity_resource, 'file')
                file_elem.set('href', f"activities/{activity['id']}.html")

    def create_qti_assessment(self, activity):
        """Create a QTI-format assessment XML file"""
        assessment = ET.Element('assessment', {
            'xmlns': "http://www.imsglobal.org/xsd/ims_qtiasiv1p2",
            'ident': f"assessment_{activity['id']}",
            'title': activity['title']
        })
        
        # Add metadata
        qtimetadata = ET.SubElement(assessment, 'qtimetadata')
        metadata_fields = {
            'cc_profile': 'cc.assignment.generic',
            'cc_assignment_type': 'assignment',
            'qmd_assessmenttype': 'Assignment',
            'qmd_weighting': str(activity.get('weighting', '100')),
            'qmd_computerscored': 'No',
        }
        
        for key, value in metadata_fields.items():
            field = ET.SubElement(qtimetadata, 'qtimetadatafield')
            fieldlabel = ET.SubElement(field, 'fieldlabel')
            fieldlabel.text = key
            fieldentry = ET.SubElement(field, 'fieldentry')
            fieldentry.text = value

        # Add section
        section = ET.SubElement(assessment, 'section')
        section.set('ident', 'root_section')
        
        # Add item
        item = ET.SubElement(section, 'item')
        item.set('ident', 'assignment_item')
        
        # Add presentation
        presentation = ET.SubElement(item, 'presentation')
        material = ET.SubElement(presentation, 'material')
        mattext = ET.SubElement(material, 'mattext')
        mattext.set('texttype', 'text/html')
        mattext.text = f"""
        <div class="assignment-content">
            <div class="description">
                {activity['description']}
            </div>
            <div class="details">
                <p>Weight: {activity.get('weighting', '0')}%</p>
                <p>Required: {'Yes' if activity.get('isRequired') else 'No'}</p>
            </div>
        </div>
        """
        
        return self.prettify(assessment)

    def create_assessment_meta(self, activity):
        """Create assessment metadata XML file"""
        meta = ET.Element('assignment', {
            'xmlns': "http://www.brightspace.com/competencies/",
            'type': "assignment"
        })
        
        title = ET.SubElement(meta, 'title')
        title.text = activity['title']
        
        instructions = ET.SubElement(meta, 'instructions')
        instructions.set('texttype', 'text/html')
        instructions.text = activity['description']
        
        grade = ET.SubElement(meta, 'grade')
        grade.set('max', '100')
        
        return self.prettify(meta)

    def create_activity_html(self, activity):
        """Create HTML content for an activity"""
        html_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>{activity['title']}</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 2em; }}
        .activity-type {{ color: #666; margin-bottom: 1em; }}
        .activity-description {{ margin: 1em 0; }}
        .activity-details {{ margin: 1em 0; padding: 1em; background: #f5f5f5; }}
        h1 {{ color: #333; }}
        h2 {{ color: #666; }}
    </style>
</head>
<body>
    <h1>{activity['title']}</h1>
    <div class="activity-type">Type: {activity['type']} - {activity['specificActivity']}</div>
    <div class="activity-description">
        {activity['description']}
    </div>
    <div class="activity-details">
        <p><strong>Study Hours:</strong> {activity['studyHours']}</p>
        {f"<div class='dev-notes'><strong>Development Notes:</strong> {activity['devNotes']}</div>" if 'devNotes' in activity and activity['devNotes'] else ""}
        {"".join(f"<p><strong>Learning Outcome {i+1}:</strong> {lo}</p>" for i, lo in enumerate(self.course_data['course']['learningOutcomes']) if i in activity.get('learningOutcomes', []))}
    </div>
    {self.create_assessment_details_html(activity) if activity['isAssessed'] else ''}
</body>
</html>"""
        return html_content

    def create_assessment_details_html(self, activity):
        """Create assessment-specific HTML content"""
        if not activity['isAssessed']:
            return ""
            
        return f"""
    <div class="assessment-details">
        <h2>Assessment Information</h2>
        <p>Pass Mark: {activity.get('passMark', '0')}%</p>
        <p>Weight: {activity.get('weighting', '0')}%</p>
        <p>Required: {'Yes' if activity.get('isRequired') else 'No'}</p>
        <p>Marking Hours: {activity.get('markingHours', 'Not specified')}</p>
    </div>"""

    def create_unit_html(self, unit, unit_activities):
        """Create HTML content for a unit"""
        activities_html = "\n".join([
            f"""<div class="activity">
                <h2>{activity['title']}</h2>
                <div class="activity-type">Type: {activity['type']} - {activity['specificActivity']}</div>
                <div class="activity-description">{activity['description']}</div>
                {"".join(f"<p><strong>Learning Outcome {i+1}:</strong> {lo}</p>" for i, lo in enumerate(self.course_data['course']['learningOutcomes']) if i in activity.get('learningOutcomes', []))}
            </div>"""
            for activity in unit_activities
        ])
        
        html = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>{unit['title']}</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 2em; }}
        .unit-description {{ margin: 1em 0; padding: 1em; background: #f8f8f8; }}
        .activity {{ margin: 2em 0; padding: 1em; border: 1px solid #ddd; }}
        .activity-type {{ color: #666; margin: 0.5em 0; }}
        .activity-description {{ margin: 1em 0; }}
        h1 {{ color: #333; }}
        h2 {{ color: #666; margin-bottom: 0.5em; }}
    </style>
</head>
<body>
    <h1>{unit['title']}</h1>
    <div class="unit-description">
        {unit['description']}
    </div>
    <div class="unit-activities">
        {activities_html}
    </div>
</body>
</html>"""
        return html

    def create_course_info_html(self):
        """Create the course information HTML file"""
        course = self.course_data['course']
        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>{course['name']}</title>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; margin: 2em; }}
        .section {{ margin: 2em 0; }}
    </style>
</head>
<body>
    <h1>{course['name']} ({course['code']})</h1>
    
    <div class="section">
        <h2>Course Goal</h2>
        {course['goal']}
    </div>
    
    <div class="section">
        <h2>Description</h2>
        {course['description']}
    </div>
    
    <div class="section">
        <h2>Course Notes</h2>
        {course.get('courseNotes', '')}
    </div>
    
    <div class="section">
        <h2>Prerequisites</h2>
        <p>{course.get('prerequisites', 'None')}</p>
    </div>
    
    <div class="section">
        <h2>Learning Outcomes</h2>
        <ul>
            {"".join(f"<li>{outcome}</li>" for outcome in course['learningOutcomes'])}
        </ul>
    </div>
    
    <div class="section">
        <h2>Course Resources</h2>
        {course.get('courseResources', '')}
    </div>
</body>
</html>"""
        return html

    def add_resources(self, resources_elem):
        """Add resource entries to the manifest"""
        # Add course info resource
        course_resource = ET.SubElement(resources_elem, 'resource',
                                    identifier="course_info",
                                    type="webcontent",
                                    href="course_info.html")

        # Add resources for units
        for unit in self.course_data['units']:
            unit_resource = ET.SubElement(resources_elem, 'resource',
                                        identifier=f"UNIT_{unit['id']}_resource",
                                        type="webcontent",
                                        href=f"units/{unit['id']}.html")
            
            # Add file element for the unit
            file_elem = ET.SubElement(unit_resource, 'file')
            file_elem.set('href', f"units/{unit['id']}.html")

        # Add resources for activities
        for activity in self.course_data['activities']:
            if activity['isAssessed']:
                # Create assessment resource
                activity_resource = ET.SubElement(resources_elem, 'resource',
                                                identifier=f"ACTIVITY_{activity['id']}_resource",
                                                type="imsqti_xmlv1p2/imscc_xmlv1p1/assessment",
                                                href=f"assessments/{activity['id']}/assessment.xml")
                
                # Add assessment file
                file_elem = ET.SubElement(activity_resource, 'file')
                file_elem.set('href', f"assessments/{activity['id']}/assessment.xml")
                
                # Add metadata file
                metadata_elem = ET.SubElement(activity_resource, 'file')
                metadata_elem.set('href', f"assessments/{activity['id']}/assessment_meta.xml")
            else:
                # Create content resource
                activity_resource = ET.SubElement(resources_elem, 'resource',
                                                identifier=f"ACTIVITY_{activity['id']}_resource",
                                                type="webcontent",
                                                href=f"activities/{activity['id']}.html")
                
                # Add file element
                file_elem = ET.SubElement(activity_resource, 'file')
                file_elem.set('href', f"activities/{activity['id']}.html")
                
    def export_to_cc(self, output_file):
        """Create the Common Cartridge package"""
        with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED) as cc_zip:
            # Add manifest
            manifest_content = self.create_manifest()
            cc_zip.writestr('imsmanifest.xml', manifest_content)

            # Add module metadata
            module_meta = self.create_module_meta()
            cc_zip.writestr('course_settings/module_meta.xml', module_meta)

           #    Create necessary directories
            directories = ['course_settings', 'assessments', 'activities', 'units']
            for directory in directories:
                # Add an empty .gitkeep file to ensure the directory is created
                cc_zip.writestr(f"{directory}/.gitkeep", "")

   
            # Add course info
            course_info = self.create_course_info_html()
            cc_zip.writestr('course_info.html', course_info)

            # Create units
            for unit in self.course_data['units']:
                unit_activities = [a for a in self.course_data['activities'] 
                                if a['unitId'] == unit['id']]
                unit_content = self.create_unit_html(unit, unit_activities)
                cc_zip.writestr(f"units/{unit['id']}.html", unit_content)

            # Create activities
            for activity in self.course_data['activities']:
                if activity['isAssessed']:
                    # Create QTI assessment file
                    assessment_content = self.create_qti_assessment(activity)
                    meta_content = self.create_assessment_meta(activity)
                    
                    cc_zip.writestr(f"assessments/{activity['id']}/assessment.xml", assessment_content)
                    cc_zip.writestr(f"assessments/{activity['id']}/assessment_meta.xml", meta_content)
                    
                    # Also create HTML version
                    activity_content = self.create_activity_html(activity)
                    cc_zip.writestr(f"activities/{activity['id']}.html", activity_content)
                else:
                    # Create regular content file
                    activity_content = self.create_activity_html(activity)
                    cc_zip.writestr(f"activities/{activity['id']}.html", activity_content)

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Convert Courseomatic JSON to Common Cartridge')
    parser.add_argument('input_file', help='Input JSON file from Courseomatic')
    parser.add_argument('output_file', help='Output .imscc file')
    args = parser.parse_args()

    exporter = CourseomaticExporter(args.input_file)
    exporter.export_to_cc(args.output_file)
    print(f"Successfully created Common Cartridge file: {args.output_file}")

if __name__ == "__main__":
    main()


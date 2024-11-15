import json
import zipfile
import xml.etree.ElementTree as ET
import tempfile
import os
import re
from bs4 import BeautifulSoup
import html2text
import uuid
import shutil

class CommonCartridgeImporter:
    def __init__(self):
        self.temp_dir = None
        self.h2t = html2text.HTML2Text()
        self.h2t.ignore_links = False
        
        # Initialize empty Courseomatic structure
        self.course_data = {
            "program": {
                "name": "",
                "level": "",
                "description": "",
                "learningOutcomes": []
            },
            "course": {
                "name": "",
                "code": "",
                "creditHours": "",
                "prerequisites": "",
                "revision": "",
                "deliveryMode": "",
                "goal": "",
                "description": "",
                "courseNotes": "",
                "courseDevelopmentNotes": "",
                "learningOutcomes": [],
                "courseResources": "",
                "changeSummary": "",
                "challengeableComments": "",
                "evaluationCriteria": "",
                "rationale": "",
                "consulted": "",
                "faculty": "",
                "studyArea": "",
                "effectiveDate": "",
                "author": "",
                "earlyStartFlag": False,
                "stipend": False,
                "revisionLevel": "",
                "deliveryModel": "",
                "teamMembers": []
            },
            "units": [],
            "activities": [],
            "mappedPLOs": []
        }

    def import_cartridge(self, cartridge_file):
        """Import a Common Cartridge file and convert to Courseomatic format"""
        # Create temporary directory
        self.temp_dir = tempfile.mkdtemp()
        
        try:
            # Extract the cartridge
            with zipfile.ZipFile(cartridge_file, 'r') as zip_ref:
                zip_ref.extractall(self.temp_dir)
            
            # Parse the manifest
            manifest_path = os.path.join(self.temp_dir, 'imsmanifest.xml')
            if not os.path.exists(manifest_path):
                raise Exception("Manifest file not found in cartridge")
            
            self.parse_manifest(manifest_path)
            
            # Parse additional metadata if available
            module_meta_path = os.path.join(self.temp_dir, 'course_settings/module_meta.xml')
            if os.path.exists(module_meta_path):
                self.parse_module_meta(module_meta_path)

            return self.course_data
            
        finally:
            # Clean up temporary directory
            if self.temp_dir:
                shutil.rmtree(self.temp_dir)

    def parse_manifest(self, manifest_path):
        """Parse the IMS manifest file"""
        tree = ET.parse(manifest_path)
        root = tree.getroot()
        
        # Handle namespace
        ns = {}
        if '}' in root.tag:
            ns['ns'] = root.tag.split('}')[0].strip('{')
            org = root.find('.//ns:organizations/ns:organization', ns)
        else:
            org = root.find('.//organizations/organization')
        
        if org is None:
            # Try alternative paths
            org = root.find('.//organization')
            if org is None:
                raise Exception("No organization found in manifest")

        # Get course title
        if ns:
            title_elem = org.find('.//ns:title', ns)
        else:
            title_elem = org.find('.//title')
            
        if title_elem is not None:
            self.course_data['course']['name'] = title_elem.text

        # Process items (units and activities)
        self.process_items(org, ns)
        
        # Process resources
        if ns:
            resources = root.find('.//ns:resources', ns)
        else:
            resources = root.find('.//resources')
            
        if resources is not None:
            self.process_resources(resources, ns)

    def process_items(self, org, ns):
        """Process organization items to create units and activities"""
        if ns:
            items = org.findall('.//ns:item', ns)
        else:
            items = org.findall('.//item')
        
        for item in items:
            identifier = item.get('identifier', '')
            if ns:
                title_elem = item.find('.//ns:title', ns)
            else:
                title_elem = item.find('.//title')
                
            title = title_elem.text if title_elem is not None else ''
            
            if 'UNIT' in identifier.upper():
                unit = {
                    'id': identifier,
                    'title': title,
                    'description': '',
                    'learningOutcomes': [],
                    'order': len(self.course_data['units'])
                }
                self.course_data['units'].append(unit)
                
    def process_resources(self, resources, ns):
        """Process resource elements"""
        for resource in resources:
            identifier = resource.get('identifier', '')
            type = resource.get('type', '')
            href = resource.get('href', '')
            
            if href:
                file_path = os.path.join(self.temp_dir, href)
                if os.path.exists(file_path):
                    if type == 'webcontent':
                        self.process_content_file(file_path, identifier)
                    elif 'assessment' in type.lower():
                        self.process_assessment_file(file_path, identifier)

    def process_content_file(self, file_path, identifier):
        """Process HTML content files"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                soup = BeautifulSoup(content, 'html.parser')
                
                # Extract content
                body = soup.find('body')
                if body:
                    description = str(body)
                    
                    # Update unit or create activity
                    if 'UNIT' in identifier.upper():
                        for unit in self.course_data['units']:
                            if unit['id'] == identifier.replace('_resource', ''):
                                unit['description'] = description
                                break
                    else:
                        activity = {
                            'id': identifier.replace('_resource', ''),
                            'type': 'acquisition',  # Default type
                            'specificActivity': 'reading',  # Default activity
                            'title': soup.title.text if soup.title else '',
                            'description': description,
                            'studyHours': 60,  # Default value
                            'unitId': self.find_parent_unit_id(identifier),
                            'isAssessed': False,
                            'learningOutcomes': []
                        }
                        self.course_data['activities'].append(activity)
        except Exception as e:
            print(f"Error processing content file {file_path}: {str(e)}")

    def process_assessment_file(self, file_path, identifier):
        """Process QTI assessment files"""
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            # Extract assessment details
            title = root.get('title', '')
            
            activity = {
                'id': identifier.replace('_resource', ''),
                'type': 'reflection',  # Default type for assessments
                'specificActivity': 'assignment',
                'title': title,
                'description': self.extract_assessment_description(root),
                'studyHours': 120,  # Default value
                'unitId': self.find_parent_unit_id(identifier),
                'isAssessed': True,
                'passMark': 50,  # Default value
                'weighting': self.extract_assessment_weight(root),
                'markingHours': 60,  # Default value
                'learningOutcomes': []
            }
            
            self.course_data['activities'].append(activity)
            
        except Exception as e:
            print(f"Error processing assessment file {file_path}: {str(e)}")

    def find_parent_unit_id(self, identifier):
        """Find the parent unit ID for an activity"""
        # For now, assign to first unit if we can't determine parent
        return self.course_data['units'][0]['id'] if self.course_data['units'] else None

    def extract_assessment_description(self, root):
        """Extract description from assessment XML"""
        # Look for description in various possible locations
        for elem in root.iter():
            if 'mattext' in elem.tag.lower():
                return elem.text or ''
        return ''

    def extract_assessment_weight(self, root):
        """Extract assessment weight from XML"""
        # Look for weight in metadata
        for elem in root.iter():
            if 'fieldlabel' in elem.tag.lower() and elem.text == 'qmd_weighting':
                parent = elem.getparent()
                if parent is not None:
                    weight_elem = parent.find('.//fieldentry')
                    if weight_elem is not None:
                        try:
                            return float(weight_elem.text)
                        except (ValueError, TypeError):
                            pass
        return 100  # Default weight

    def parse_module_meta(self, meta_path):
        """Parse module metadata XML file"""
        try:
            tree = ET.parse(meta_path)
            root = tree.getroot()
            
            # Extract course metadata
            title = root.find('.//title')
            if title is not None:
                self.course_data['course']['name'] = title.text
            
            description = root.find('.//description')
            if description is not None:
                self.course_data['course']['description'] = description.text
            
            org_unit = root.find('.//org_unit')
            if org_unit is not None:
                self.course_data['course']['faculty'] = org_unit.text
                
        except Exception as e:
            print(f"Error parsing module metadata: {str(e)}")

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Convert Common Cartridge to Courseomatic JSON')
    parser.add_argument('input_file', help='Input .imscc file')
    parser.add_argument('output_file', help='Output .json file')
    args = parser.parse_args()

    importer = CommonCartridgeImporter()
    course_data = importer.import_cartridge(args.input_file)
    
    with open(args.output_file, 'w', encoding='utf-8') as f:
        json.dump(course_data, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully created Courseomatic JSON file: {args.output_file}")

if __name__ == "__main__":
    main()

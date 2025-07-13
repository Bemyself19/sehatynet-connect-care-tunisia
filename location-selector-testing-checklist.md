# Location Selector Testing Checklist

## Setup
1. Ensure all expanded location data files are included in the project
2. Check that the index.ts file is importing all expanded files correctly
3. Verify the application starts without errors

## Basic Functionality
1. Verify that the country dropdown shows the list of all countries
2. Select a country and verify that the provinces dropdown is populated with provinces from that country
3. Select a province and verify that the cities dropdown is populated with cities from that province
4. Clear the selections and verify that the dropdowns reset correctly

## Filter Functionality
1. Type in the country search box and verify that the list filters correctly
2. Verify filtering works for Latin characters (English and French)
3. Verify filtering works for Arabic characters
4. Type in the province search box and verify that the list filters correctly
5. Type in the city search box and verify that the list filters correctly
6. Clear the search boxes and verify that the complete lists are shown again

## Edge Cases
1. Test with a very long list of results (e.g., all cities in a large province)
2. Test with a very small list of results (e.g., one city in a province)
3. Test with no results (type a search that won't match any items)
4. Test with special characters in the search
5. Test filtering performance with large datasets

## Internationalization
1. Switch the application language to English and verify all labels and placeholders
2. Switch the application language to French and verify all labels and placeholders
3. Switch the application language to Arabic and verify all labels and placeholders (including right-to-left layout)

## Form Integration
1. Test in the Patient registration form
2. Test in the Doctor registration form
3. Test in the Pharmacy registration form
4. Test in the Lab registration form
5. Test in the Radiology registration form
6. Test in the Profile editing forms for all user types

## Browser Compatibility
1. Test in Chrome
2. Test in Firefox
3. Test in Safari
4. Test in Edge
5. Test on mobile devices

## Saving and Loading
1. Select country, province, and city and save the form
2. Load the form again and verify that the selections are preserved
3. Edit the form and change the selections, then save again
4. Verify that the changes are preserved

## Accessibility
1. Test keyboard navigation through the dropdowns
2. Test screen reader compatibility
3. Test with high contrast mode

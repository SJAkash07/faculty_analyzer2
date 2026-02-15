# Batch Faculty Selection Feature

## Overview
The batch faculty lookup feature has been enhanced to handle multiple matches for the same name. Instead of automatically picking the first result, the system now presents all options and lets users choose the correct researcher.

## Problem Solved
Previously, when searching for a common name like "Anubhav Kumar" or "John Smith", the system would automatically select the first match from OpenAlex, which might not be the correct person. This led to inaccurate batch results.

## New Behavior

### 1. **Automatic Single Match**
When a name has only one match in OpenAlex, it's automatically added to the results table (no user action needed).

### 2. **Multiple Match Selection**
When a name has multiple matches (2-5 results), the system:
- Pauses the batch process
- Shows a selection UI with all matching researchers
- Displays key information for each match:
  - Full name
  - Institution
  - Number of publications
  - Citation count
  - h-index
- Allows user to select the correct person via radio buttons
- First option is pre-selected by default

### 3. **No Match Found**
When a name has no matches, it's marked as "Not found" in the results table.

## User Interface

### Selection Screen
```
Multiple Matches Found
Please select the correct researcher for each name:

┌─────────────────────────────────────────────────────┐
│ Anubhav Kumar                        3 matches found │
├─────────────────────────────────────────────────────┤
│ ○ A. Das                                            │
│   University of Notre Dame · 443 publications ·     │
│   12366 citations · h-index: 57                     │
│                                                     │
│ ○ Anubhav Kumar                                     │
│   IIT Delhi · 89 publications · 1234 citations ·   │
│   h-index: 23                                       │
│                                                     │
│ ○ Anubhav Kumar                                     │
│   Stanford University · 156 publications ·          │
│   5678 citations · h-index: 34                      │
└─────────────────────────────────────────────────────┘

[Confirm Selections]  [Cancel]
```

### Features
- **Radio button selection** - Only one option can be selected per name
- **Visual feedback** - Selected option is highlighted with accent color
- **Hover effects** - Options highlight on hover for better UX
- **Responsive design** - Works on mobile and desktop
- **Clear information** - All relevant metrics displayed for informed decision

## Technical Implementation

### Backend Changes
**File**: `backend/main.py`

```python
# Changed from per_page=1 to per_page=5
params={"search": name, "per_page": 5}

# New response structure
{
  "count": 2,
  "results": [...],  # Confirmed single matches
  "needs_selection": [  # Names with multiple matches
    {
      "name_requested": "Anubhav Kumar",
      "options": [
        {
          "author_id": "A5046747931",
          "display_name": "A. Das",
          "works_count": 443,
          "cited_by_count": 12366,
          "h_index": 57,
          "i10_index": 263,
          "institution": "University of Notre Dame"
        },
        // ... more options
      ]
    }
  ]
}
```

### Frontend Changes
**File**: `frontend/app.js`

1. **Detection**: Checks if `needs_selection` exists in response
2. **UI Display**: Shows selection interface with all options
3. **User Selection**: Captures radio button choices
4. **Confirmation**: Merges selected results with confirmed results
5. **Display**: Shows final batch table with all selections

### CSS Styling
**File**: `frontend/styles.css`

- Modern card-based selection UI
- Radio button styling with accent colors
- Hover and selected states
- Responsive layout for mobile
- Professional spacing and typography

## User Workflow

1. **Enter Names**: User enters faculty names (one per line)
2. **Click "Run batch"**: System searches for all names
3. **Review Matches**: 
   - Single matches → Added automatically
   - Multiple matches → Selection UI appears
   - No matches → Marked as "Not found"
4. **Select Correct Researchers**: User chooses from radio options
5. **Confirm Selections**: Click "Confirm Selections" button
6. **View Results**: Complete batch table with all faculty

## Benefits

✅ **Accuracy**: Users select the correct researcher, not just the first result
✅ **Transparency**: All matching options are visible with full details
✅ **Efficiency**: Single matches are still automatic (no extra clicks)
✅ **Informed Decisions**: Key metrics help identify the right person
✅ **Better UX**: Clear, intuitive selection interface
✅ **Flexibility**: Users can cancel and try different names

## Example Scenarios

### Scenario 1: All Single Matches
```
Input:
- Marie Curie
- Albert Einstein
- Isaac Newton

Result: All three automatically added to table (no selection needed)
```

### Scenario 2: Mixed Results
```
Input:
- John Smith (3 matches) → Selection UI
- Marie Curie (1 match) → Auto-added
- Jane Doe (0 matches) → Marked "Not found"

Result: Selection UI shows only "John Smith" options
After selection: Complete table with all three names
```

### Scenario 3: Multiple Names Need Selection
```
Input:
- John Smith (3 matches)
- David Lee (2 matches)
- Sarah Johnson (4 matches)

Result: Selection UI shows all three names with their options
User selects one option for each name
Complete table generated after confirmation
```

## API Response Examples

### Single Match (Auto-added)
```json
{
  "count": 1,
  "results": [
    {
      "name_requested": "Marie Curie",
      "found": true,
      "author_id": "A123456",
      "display_name": "Marie Curie",
      "works_count": 150,
      "cited_by_count": 50000,
      "h_index": 45,
      "i10_index": 120,
      "institution": "University of Paris"
    }
  ],
  "needs_selection": null
}
```

### Multiple Matches (Needs Selection)
```json
{
  "count": 0,
  "results": [],
  "needs_selection": [
    {
      "name_requested": "John Smith",
      "options": [
        {
          "author_id": "A111111",
          "display_name": "John Smith",
          "works_count": 200,
          "cited_by_count": 10000,
          "h_index": 35,
          "i10_index": 150,
          "institution": "MIT"
        },
        {
          "author_id": "A222222",
          "display_name": "John A. Smith",
          "works_count": 89,
          "cited_by_count": 3000,
          "h_index": 22,
          "i10_index": 65,
          "institution": "Stanford University"
        }
      ]
    }
  ]
}
```

## Future Enhancements

Possible improvements for future versions:
- Search within selection options
- Sort options by relevance/citations
- Show author photos if available
- Add "Skip this name" option
- Remember previous selections for same names
- Bulk select all first options
- Export selection choices for reuse

## Testing

To test the feature:
1. Go to "Batch summary" tab
2. Enter common names like:
   - John Smith
   - David Lee
   - Maria Garcia
   - Anubhav Kumar
3. Click "Run batch"
4. Verify selection UI appears for names with multiple matches
5. Select different options and confirm
6. Check that final table shows selected researchers

## Conclusion

This enhancement significantly improves the accuracy and usability of the batch faculty lookup feature. Users now have full control over which researcher is selected when multiple matches exist, leading to more reliable batch analysis results.

Task: Extract seams from the following PRD and return a JSON object with the structure:
{
  "summary": { "notes": string, "assumptions": string[] },
  "seams": [
    {
      "source": string,           // e.g., "UI"
      "target": string,           // e.g., "TabManager"
      "dataIn": string | object,  // plain text or structured description
      "dataOut": string | object, // plain text or structured description
      "contract": string,         // e.g., "ITabManager.createGroup"
      "priority": "P0" | "P1" | "P2",
      "notes": string             // optional clarifications or assumptions
    }
  ]
}

Only return JSON. Do NOT include markdown code fences.

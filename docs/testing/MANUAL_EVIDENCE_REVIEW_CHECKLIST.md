# Manual evidence review checklist

This is the overview for the current manual forms. Detailed case scopes, plain-English steps, expected results and blank result rows live in the linked checklists.

## Choose a form

| Code | Meaning / environment                                    | Blank checklist                                                                  | Fictional answer guide                                         |
| ---- | -------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| PAFC | Phone App Functional Checklist; installed Android APK    | [Functional checklist](FUNCTIONAL_CHECKLIST.md#phone-app-functional-cases)       | [Functional sample](FUNCTIONAL_CHECKLIST_SAMPLE.md)            |
| PWFC | Phone Website Functional Checklist; actual phone browser | [Functional checklist](FUNCTIONAL_CHECKLIST.md#phone-website-functional-cases)   | [Functional sample](FUNCTIONAL_CHECKLIST_SAMPLE.md)            |
| DFC  | Desktop Functional Checklist; actual computer website    | [Functional checklist](FUNCTIONAL_CHECKLIST.md#desktop-website-functional-cases) | [Functional sample](FUNCTIONAL_CHECKLIST_SAMPLE.md)            |
| RC   | Reliability Checklist; physical Android app              | [Physical reliability checklist](PHYSICAL_RELIABILITY_CHECKLIST.md)              | [Reliability sample](PHYSICAL_RELIABILITY_CHECKLIST_SAMPLE.md) |

Samples are fictional writing guides, never completed research evidence. Phone and desktop website offline/reconnection observations have their own section in the reliability sheet; no new numbered IDs are assigned there. Historical/manual R and automated R01-R04 IDs retain their original scope; new manual RC IDs do not rename them.

## Record and review evidence

1. Record tester, actual dates, device/browser, exact installed native version, active web bundle/model, network/backup state and scope. Identify physical and emulator environments separately.
2. Keep the original video filename and location. Give relevant timestamps and recording date for each case. A case may use multiple clips, and one clip may support multiple cases. Separately filmed checks are valid when their dates/builds are recorded honestly.
3. Keep full videos on the phone when agreed; do not require laptop copies. Document any sampled frames, clip boundaries, gaps and review method. Keep recovery codes and credentials out of shared/tracked evidence; privately performed steps may be reported by the tester without exposing values.
4. Write **actual observation** in plain English: "The guide opened; Close returned to Home." Record unexpected outcomes and limits. Pressing controls alone does not establish that their expected outcomes occurred.
5. Record Pass for completed expected outcomes, Fail for observed incorrect behavior, or Blocked when a required action/outcome is untested or cannot be established. A **Pass (tester reported)** identifies the tester's firsthand report; a reviewer records only what their independent review supports. Keep original findings and later clarifications/retests; do not erase observed failures.

These records support the stated functions and conditions. They do not establish classification accuracy, SUS scores, backend ownership, all-field reliability or release approval by themselves. See [TESTING.md](TESTING.md) for automated scope and technical evidence requirements.

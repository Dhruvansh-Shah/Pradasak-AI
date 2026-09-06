# Project Agent Instructions & Slash Commands

## BMad Slash Command Routing
When the user sends a message starting with a forward slash (`/`), parse and route it directly to the matching BMad skill:

- `/bmad` or `/bmad help`: Run the `bmad` skill to provide guidance and analyze project status.
- `/bmad-build` or `/build`: Invoke the `bmad-build` skill with the user's change request.
- `/bmad-review` or `/review`: Invoke the `bmad-review` skill across review lenses.
- `/bmad-party-mode` or `/party-mode`: Invoke the `bmad-party-mode` skill for multi-agent discussions.
- `/bmad-architecture` or `/arch` or `/architecture`: Invoke the `bmad-architecture` skill.
- `/bmad-prd` or `/prd`: Invoke the `bmad-prd` skill.
- `/bmad-spec` or `/spec`: Invoke the `bmad-spec` skill.
- `/bmad-deep-recon` or `/recon`: Invoke the `bmad-deep-recon` skill.
- `/bmad-brainstorming` or `/brainstorm`: Invoke the `bmad-brainstorming` skill.
- `/bmad-doctor` or `/doctor`: Run BMad doctor diagnostic check.
- `/bmad-update` or `/update`: Run BMad update inspection.

Always honor the user's intent immediately when they use these slash commands.

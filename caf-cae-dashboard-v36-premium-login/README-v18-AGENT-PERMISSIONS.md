# v18 Agent Permissions Hotfix

Fix: Agent CGN-style service catalogue now respects Admin service permissions.

- Agent sees full catalogue, like CGN style.
- Only services enabled by Admin for that agent are marked **Attivo** and clickable.
- Other services stay visible but show **Da attivare** and cannot create domanda.
- Favourite services also respect permissions.

No database SQL required.

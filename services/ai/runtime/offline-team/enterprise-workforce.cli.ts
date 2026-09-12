import { ENTERPRISE_WORKFORCE, summarizeWorkforce } from './enterprise-workforce';
// Source inventory only. No database, process, provider or filesystem write.
if (process.argv.length!==2) { console.error('This inventory command accepts no arguments.'); process.exitCode=2; }
else console.log(JSON.stringify({...summarizeWorkforce(),roles:ENTERPRISE_WORKFORCE},null,2));

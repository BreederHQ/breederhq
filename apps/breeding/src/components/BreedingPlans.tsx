import BHQGantt from "@bhq/ui/components/Gantt";
import { windowsFromPlan, defaultStageVisuals } from "./adapters/planToGantt";

// inside your plan drawer/details where you currently draw the chart:
const wr = windowsFromPlan(plan);
<BHQGantt
  title="Timeline"
  stages={defaultStageVisuals()}
  data={wr.stages}
  travel={wr.travel}
  horizon={wr.horizon}
  today={wr.today}
  showToday
  showTravel
  className="mt-3"
/>;

import { createHomePageMarkup } from './HomePage.js';
import { createDestinationsPageMarkup } from './DestinationsPage.js';
import { createMapPageMarkup } from './MapPage.js';
import { createGalleryPageMarkup } from './GalleryPage.js';
import { createCulinaryPageMarkup } from './CulinaryPage.js';
import { createStayPageMarkup } from './StayPage.js';
import { createWaterboomPageMarkup } from './WaterboomPage.js';
import { createTravelCarPageMarkup } from './TravelCarPage.js';
import { createPlannerPageMarkup } from './PlannerPage.js';
import { createChecklistPageMarkup } from './ChecklistPage.js';
import { createSummaryPageMarkup } from './SummaryPage.js';

export function mountPages() {
  const outlet = document.getElementById('pagesOutlet');
  if (!outlet) return;

  outlet.innerHTML = [
    createHomePageMarkup(),
    createDestinationsPageMarkup(),
    createMapPageMarkup(),
    createGalleryPageMarkup(),
    createCulinaryPageMarkup(),
    createStayPageMarkup(),
    createWaterboomPageMarkup(),
    createTravelCarPageMarkup(),
    createPlannerPageMarkup(),
    createChecklistPageMarkup(),
    createSummaryPageMarkup(),
  ].join('\n');
}

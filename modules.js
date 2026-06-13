/**
 * Module Tier Gating UI
 * Displays modules with access status and upgrade prompts
 */

// API_URL is defined in community.js (loaded first)
// If for some reason it's not, set it here
if (typeof API_URL === 'undefined') {
  window.API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://api.travelsmarterapp.com';
}

// Get auth token
function getAuthToken() {
  return localStorage.getItem('userToken');
}

/**
 * Load all modules with tier access info
 */
async function loadModules() {
  try {
    const token = getAuthToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    console.log('Loading modules with token:', token ? 'YES' : 'NO');
    const response = await fetch(`${API_URL}/api/hacks/modules`, { headers });

    if (!response.ok) {
      console.error('Failed to load modules:', response.status);
      return;
    }

    const data = await response.json();
    console.log('API Response:', data);
    console.log('User Tier:', data.userTier);
    displayModules(data);
  } catch (error) {
    console.error('Error loading modules:', error);
  }
}

/**
 * Display modules with lock status
 */
function displayModules(data) {
  const container = document.getElementById('modules-container');
  if (!container) return;

  const { userTier, userTierName, modules } = data;

  // Display current tier info
  const tierInfo = document.getElementById('tier-info');
  if (tierInfo) {
    tierInfo.innerHTML = `
      <div style="padding: 15px; background: #e3f2fd; border-radius: 8px; margin-bottom: 20px;">
        <strong>Current Tier:</strong> ${userTierName}
        ${userTier !== 'elite' ? `<br><a href="sales-page.html" style="color: #1976d2; text-decoration: none;">Upgrade for more modules →</a>` : ''}
      </div>
    `;
  }

  // Create module grid
  const grid = document.createElement('div');
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  `;

  modules.forEach(module => {
    const card = createModuleCard(module);
    grid.appendChild(card);
  });

  // Add Community + Partner Deals cards (Elite only)
  const isEliteUser = userTier && userTier.toLowerCase() === 'elite';

  const communityCard = createSpecialCard({
    icon: '💬',
    title: 'Travel Community',
    description: 'Connect with fellow travel hackers. Share tips, ask questions, celebrate wins.',
    badge: '⭐ Elite',
    badgeColor: '#f59e0b',
    accessible: isEliteUser,
    onClick: () => {
      if (isEliteUser) {
        document.getElementById('community-section')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = 'sales-page.html';
      }
    }
  });

  const partnerCard = createSpecialCard({
    icon: '🤝',
    title: 'Partner Deals',
    description: 'Save up to 50% on travel essentials — Wise, Airalo, NordVPN, Booking.com and more.',
    badge: '⭐ Elite',
    badgeColor: '#f59e0b',
    accessible: isEliteUser,
    onClick: () => {
      if (isEliteUser) {
        window.location.href = 'partner-deals.html';
      } else {
        window.location.href = 'sales-page.html';
      }
    }
  });

  grid.appendChild(communityCard);
  grid.appendChild(partnerCard);

  container.innerHTML = '';
  container.appendChild(grid);

  // Show community section if user is Elite
  const communitySection = document.getElementById('community-section');
  const eliteBanner = document.getElementById('elite-banner');
  const communityControls = document.getElementById('community-controls');

  console.log('=== COMMUNITY SECTION DEBUG ===');
  console.log('userTier:', userTier);
  console.log('communitySection exists:', !!communitySection);
  console.log('eliteBanner exists:', !!eliteBanner);
  console.log('communityControls exists:', !!communityControls);

  if (communitySection) {
    // Case-insensitive tier check
    const isElite = userTier && userTier.toLowerCase() === 'elite';
    console.log('isElite:', isElite);

    if (isElite) {
      console.log('Setting community section to VISIBLE for Elite user');
      communitySection.style.display = 'block';
      eliteBanner.style.display = 'none';
      communityControls.style.display = 'flex';

      // Load community discussions for first module (module 8 - Community)
      document.getElementById('current-module-id').value = '8';
      console.log('Calling loadCommunityPosts...');
      loadCommunityPosts('8', 'recent');
    } else {
      console.log('User is not Elite, showing upgrade banner');
      communitySection.style.display = 'block';
      eliteBanner.style.display = 'block';
      communityControls.style.display = 'none';
      document.getElementById('community-posts-container').innerHTML = '';
    }
  } else {
    console.log('ERROR: community-section element not found!');
  }
}

/**
 * Create a module card with lock state
 */
function createModuleCard(module) {
  const card = document.createElement('div');
  card.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    cursor: ${module.accessible ? 'pointer' : 'default'};
    position: relative;
    overflow: hidden;
  `;

  if (!module.accessible) {
    card.style.cssText += `
      opacity: 0.6;
      filter: grayscale(100%);
      background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
    `;
  } else {
    card.style.cssText += `
      cursor: pointer;
    `;
    card.onmouseover = () => {
      card.style.transform = 'translateY(-4px)';
      card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
    };
    card.onmouseout = () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    };
  }

  // Tier badge
  const tierInfo = module.id <= 4
    ? { label: 'Free', color: '#10b981' }
    : module.id <= 10
      ? { label: 'Smart Traveler', color: '#667eea' }
      : { label: 'Elite', color: '#f59e0b' };

  const tierBadge = `
    <div style="position:absolute;top:10px;right:10px;background:${tierInfo.color};color:white;font-size:11px;font-weight:700;padding:3px 8px;border-radius:10px;white-space:nowrap;">
      ${tierInfo.label === 'Elite' ? '⭐ ' : ''}${tierInfo.label}
    </div>
  `;

  const upgradeButton = module.locked ? `
    <button onclick="goToPricing()" style="
      width: 100%;
      padding: 10px;
      margin-top: 15px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.3s;
    " onmouseover="this.style.background='#5568d3'" onmouseout="this.style.background='#667eea'">
      Upgrade to Unlock
    </button>
  ` : '';

  const unlockInfo = module.locked ? `
    <p style="color: #ef4444; font-size: 0.9em; margin-top: 10px; font-weight: 500;">
      ${module.message}
    </p>
  ` : '';

  card.innerHTML = `
    ${tierBadge}
    <div style="font-size: 32px; margin-bottom: 10px;">${module.icon}</div>
    <h3 style="margin-bottom: 8px; color: #1f2937; font-size: 1.1em;">${module.title}</h3>
    <p style="color: #6b7280; font-size: 0.9em; margin-bottom: 10px;">
      ${module.hackCount} hacks
    </p>
    ${unlockInfo}
    ${upgradeButton}
  `;

  if (module.accessible) {
    card.onclick = () => viewModule(module.id);
  }

  return card;
}

/**
 * Create a special feature card (Community, Partner Deals)
 */
function createSpecialCard({ icon, title, description, badge, badgeColor, accessible, onClick }) {
  const card = document.createElement('div');
  card.style.cssText = `
    background: ${accessible ? 'white' : 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)'};
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    ${!accessible ? 'opacity: 0.65; filter: grayscale(60%);' : ''}
  `;

  if (accessible) {
    card.onmouseover = () => { card.style.transform = 'translateY(-4px)'; card.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; };
    card.onmouseout = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; };
  }

  card.innerHTML = `
    <div style="position:absolute;top:10px;right:10px;background:${accessible ? badgeColor : '#9ca3af'};color:white;font-size:11px;font-weight:700;padding:3px 8px;border-radius:10px;">${badge}</div>
    <div style="font-size:32px;margin-bottom:10px;">${icon}</div>
    <h3 style="margin-bottom:8px;color:#1f2937;font-size:1.1em;">${title}</h3>
    <p style="color:#6b7280;font-size:0.9em;margin-bottom:10px;line-height:1.5;">${description}</p>
    ${!accessible ? `<button onclick="goToPricing()" style="width:100%;padding:10px;margin-top:5px;background:#667eea;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.9em;">⭐ Upgrade to Elite</button>` : ''}
  `;

  card.onclick = onClick;
  return card;
}

/**
 * Navigate to module details
 */
function viewModule(moduleId) {
  window.location.href = `module.html?id=${moduleId}`;
}

/**
 * Navigate to pricing page
 */
function goToPricing() {
  window.location.href = 'sales-page.html';
}

/**
 * Change community discussion sort
 */
function changeCommunitySort(sortType) {
  // Update active button
  document.querySelectorAll('.sort-buttons button').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Load posts with new sort
  const moduleId = document.getElementById('current-module-id').value;
  loadCommunityPosts(moduleId, sortType);
}

// Load modules when page loads
document.addEventListener('DOMContentLoaded', loadModules);

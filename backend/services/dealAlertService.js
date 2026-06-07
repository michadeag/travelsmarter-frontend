/**
 * Deal Alert Service
 * Manages sending deal alerts to users with filter support
 */

const pool = require('../config/database');
const sgMail = require('@sendgrid/mail');
const dealFilterController = require('../controllers/dealFilterController');

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Send deal alert to Elite users
 * Filters deals based on user preferences
 */
exports.sendDealAlert = async (dealId) => {
  try {
    // Get deal details
    const dealResult = await pool.query(
      'SELECT * FROM deals WHERE id = $1 AND is_active = true',
      [dealId]
    );

    if (dealResult.rows.length === 0) {
      throw new Error('Deal not found');
    }

    const deal = dealResult.rows[0];

    // Get all Elite users with email alerts enabled
    const usersResult = await pool.query(
      `SELECT u.id, u.email, u.first_name
       FROM users u
       INNER JOIN subscriptions s ON u.id = s.user_id
       WHERE s.tier = 'elite'
       AND u.email_alerts_enabled = true
       AND s.is_active = true`
    );

    let sentCount = 0;
    let filteredCount = 0;

    // Send to each user, respecting their filters
    for (const user of usersResult.rows) {
      try {
        // Check if deal passes user's filters
        const passesFilters = await dealFilterController.passesUserFilters(user.id, {
          dealType: deal.deal_type,
          estimatedSavings: deal.value_amount
        });

        if (!passesFilters) {
          filteredCount++;
          continue;
        }

        // Send alert email
        await sgMail.send({
          to: user.email,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@travelsmarterapp.com',
          subject: `🎉 New ${deal.category} Deal: Save €${deal.value_amount}`,
          html: generateDealAlertHTML(user.first_name, deal)
        });

        sentCount++;
      } catch (error) {
        console.error(`Error sending alert to user ${user.id}:`, error);
      }
    }

    return {
      success: true,
      dealId,
      sentCount,
      filteredCount,
      totalUsers: usersResult.rows.length
    };
  } catch (error) {
    console.error('Send deal alert error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send weekly deals digest to Elite users
 * Includes top deals from the week, filtered by user preferences
 */
exports.sendWeeklyDealsDigest = async () => {
  try {
    // Get all Elite users with email alerts enabled
    const usersResult = await pool.query(
      `SELECT u.id, u.email, u.first_name
       FROM users u
       INNER JOIN subscriptions s ON u.id = s.user_id
       WHERE s.tier = 'elite'
       AND u.email_alerts_enabled = true
       AND s.is_active = true`
    );

    let sentCount = 0;

    // Send to each user
    for (const user of usersResult.rows) {
      try {
        // Get top deals from this week
        const dealsResult = await pool.query(
          `SELECT id, title, description, category, deal_type, value_amount,
                  upvote_count, image_url
           FROM deals
           WHERE is_active = true
           AND created_at > NOW() - INTERVAL '7 days'
           ORDER BY upvote_count DESC
           LIMIT 5`
        );

        // Filter deals based on user preferences
        const filteredDeals = [];
        for (const deal of dealsResult.rows) {
          const passesFilters = await dealFilterController.passesUserFilters(user.id, {
            dealType: deal.deal_type,
            estimatedSavings: deal.value_amount
          });

          if (passesFilters) {
            filteredDeals.push(deal);
          }
        }

        // Skip if no deals pass filters
        if (filteredDeals.length === 0) {
          continue;
        }

        // Send digest email
        await sgMail.send({
          to: user.email,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@travelsmarterapp.com',
          subject: '📬 Your TravelSmarter Weekly Deals Digest',
          html: generateWeeklyDigestHTML(user.first_name, filteredDeals)
        });

        sentCount++;
      } catch (error) {
        console.error(`Error sending weekly digest to user ${user.id}:`, error);
      }
    }

    return {
      success: true,
      sentCount,
      totalUsers: usersResult.rows.length
    };
  } catch (error) {
    console.error('Send weekly digest error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate HTML for deal alert email
 */
function generateDealAlertHTML(firstName, deal) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">🎉 New Deal Alert!</h2>
      </div>

      <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 8px 8px;">
        <p style="font-size: 1.1em; color: #333;">Hi ${firstName || 'Traveler'},</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="color: #667eea; margin-top: 0;">${deal.title}</h3>
          <p style="color: #666; line-height: 1.6;">${deal.description || 'Check out this amazing deal!'}</p>

          <div style="background: #f0f4ff; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="color: #667eea; font-weight: bold; margin: 0;">
              💰 Save: €${deal.value_amount}
            </p>
            <p style="color: #666; margin: 5px 0 0 0;">Category: ${deal.category}</p>
          </div>

          <p style="color: #999; font-size: 0.9em; margin: 15px 0 0 0;">
            Posted: ${new Date(deal.created_at).toLocaleDateString()}
            ${deal.expires_at ? ` | Expires: ${new Date(deal.expires_at).toLocaleDateString()}` : ''}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://travelsmarterapp.com'}/deals/${deal.id}"
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; display: inline-block; font-weight: bold;">
            View Deal
          </a>
        </div>

        <div style="background: #fff3cd; padding: 12px; border-radius: 6px; margin-top: 20px;">
          <p style="color: #856404; font-size: 0.9em; margin: 0;">
            💡 Tip: Manage your deal preferences in your account settings to get alerts only for deals you care about.
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate HTML for weekly deals digest email
 */
function generateWeeklyDigestHTML(firstName, deals) {
  const dealsHTML = deals.map(deal => `
    <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #667eea;">
      <h4 style="color: #667eea; margin: 0 0 8px 0;">${deal.title}</h4>
      <p style="color: #666; font-size: 0.95em; margin: 0 0 10px 0;">${deal.description || deal.category}</p>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #667eea; font-weight: bold;">💰 Save €${deal.value_amount}</span>
        <span style="color: #999; font-size: 0.9em;">👍 ${deal.upvote_count || 0} upvotes</span>
      </div>
    </div>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">📬 Your Weekly Deals Digest</h2>
        <p style="margin: 10px 0 0 0; font-size: 0.95em;">The best deals curated just for you</p>
      </div>

      <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 8px 8px;">
        <p style="font-size: 1.1em; color: #333;">Hi ${firstName || 'Traveler'},</p>
        <p style="color: #666; line-height: 1.6;">
          Here are this week's top deals that match your travel interests. All of these meet your filter preferences!
        </p>

        <div style="margin: 30px 0;">
          ${dealsHTML}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://travelsmarterapp.com'}/deals"
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; display: inline-block; font-weight: bold;">
            View All Deals
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 0.85em; text-align: center;">
          Questions? <a href="mailto:support@travelsmarterapp.com" style="color: #667eea; text-decoration: none;">Contact us</a> or manage your preferences in your account.
        </p>
      </div>
    </div>
  `;
}

module.exports = exports;

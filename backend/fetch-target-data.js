const API_BASE_URL = 'http://localhost:8080'; // Adjust if needed
const TOKEN = 'your-jwt-token-here'; // Replace with actual token

async function fetchTargetData(targetId) {
  try {
    // Fetch basic target data
    const targetResponse = await fetch(`${API_BASE_URL}/v1/targets/${targetId}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
      },
    });

    if (!targetResponse.ok) {
      throw new Error('Failed to fetch target data');
    }

    const targetData = await targetResponse.json();
    const basicTarget = targetData.data;

    console.log('Basic target:', basicTarget);

    // Initialize complete target object
    let completeTarget = { ...basicTarget };

    // Fetch additional data from _links if available
    if (basicTarget._links) {
      // Fetch history
      if (basicTarget._links.history) {
        try {
          const historyResponse = await fetch(`${API_BASE_URL}${basicTarget._links.history}`, {
            headers: {
              'Authorization': `Bearer ${TOKEN}`,
            },
          });
          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            completeTarget.history = historyData.data || [];
          } else {
            completeTarget.history = [];
          }
        } catch (err) {
          console.error('Error fetching history:', err);
          completeTarget.history = [];
        }
      }

      // Fetch metrics
      if (basicTarget._links.metrics) {
        try {
          const metricsResponse = await fetch(`${API_BASE_URL}${basicTarget._links.metrics}`, {
            headers: {
              'Authorization': `Bearer ${TOKEN}`,
            },
          });
          if (metricsResponse.ok) {
            const metricsData = await metricsResponse.json();
            completeTarget.metrics = metricsData.data || null;
          } else {
            completeTarget.metrics = null;
          }
        } catch (err) {
          console.error('Error fetching metrics:', err);
          completeTarget.metrics = null;
        }
      }

      // Fetch statistics
      if (basicTarget._links.statistics) {
        try {
          const statisticsResponse = await fetch(`${API_BASE_URL}${basicTarget._links.statistics}`, {
            headers: {
              'Authorization': `Bearer ${TOKEN}`,
            },
          });
          if (statisticsResponse.ok) {
            const statisticsData = await statisticsResponse.json();
            completeTarget.statistics = statisticsData.data || null;
          } else {
            completeTarget.statistics = null;
          }
        } catch (err) {
          console.error('Error fetching statistics:', err);
          completeTarget.statistics = null;
        }
      }
    }

    console.log('Complete target object:', JSON.stringify(completeTarget, null, 2));
    console.log('History list:', completeTarget.history);
    console.log('Metrics data:', completeTarget.metrics);
    console.log('Statistics data:', completeTarget.statistics);

    return completeTarget;

  } catch (err) {
    console.error('Error:', err);
  }
}


// Example usage with the target ID from your example
fetchTargetData('019aec8b-d045-7d4b-9c9a-e9c2e3425631');
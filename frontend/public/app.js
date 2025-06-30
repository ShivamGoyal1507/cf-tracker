const loading = document.getElementById('loading');

async function fetchUser(handle) {
  await fetch('/api/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handle })
  });

  const res = await fetch(`/api/user/${handle}/stats`);
  if (!res.ok) throw new Error('Stats fetch failed');
  const data = await res.json();
  drawChart(data.ratingTimeline);
  showUserStats(handle, data.ratingTimeline);

  const tagRes = await fetch(`/api/user/${handle}/tags`);
  if (tagRes.ok) {
    const tagData = await tagRes.json();
    drawTagPie(tagData.tags);
  }

  drawCalendar(data.ratingTimeline);
}

function drawChart(ratingData) {
  const labels = ratingData.map(p => new Date(p.date).toLocaleDateString());
  const values = ratingData.map(p => p.rating);
  const ctx = document.getElementById('ratingChart').getContext('2d');
  if (window.myChart) window.myChart.destroy();
  window.myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Rating',
        data: values,
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63,81,181,0.2)',
        fill: true,
        tension: 0.3,
        pointRadius: 2
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true }, tooltip: { mode: 'index' } },
      scales: { y: { beginAtZero: false } }
    }
  });
}

function drawTagPie(tags) {
  const counts = tags.reduce((a, t) => { a[t] = (a[t] || 0) + 1; return a; }, {});
  const colors = ['#3f51b5','#e91e63','#4caf50','#ff9800','#9c27b0','#03a9f4','#f44336','#00bcd4','#8bc34a','#ffc107','#795548','#607d8b'];
  const data = {
    labels: Object.keys(counts),
    datasets: [{
      data: Object.values(counts),
      backgroundColor: colors.slice(0, Object.keys(counts).length)
    }]
  };
  const ctx = document.getElementById('tagPie').getContext('2d');
  if (window.myPieChart) window.myPieChart.destroy();
  window.myPieChart = new Chart(ctx, { type: 'pie', data });
}

function showUserStats(handle, data) {
  const maxRating = Math.max(...data.map(d => d.rating));
  document.getElementById('cfHandle').innerText = handle;
  document.getElementById('totalContests').innerText = data.length;
  document.getElementById('maxRating').innerText = maxRating;
  document.getElementById('infoBox').style.display = 'block';
}

function drawCalendar(ratingTimeline) {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  const events = ratingTimeline.map(e => ({
    title: `📊 ${e.rating}`,
    start: new Date(e.date).toISOString(),
    color: '#3f51b5'
  }));

  fetch('/api/user/contests/upcoming')
    .then(res => res.json())
    .then(data => {
      const upcoming = data.contests.map(c => ({
        title: `🟢 ${c.name}`,
        start: new Date(c.startTime).toISOString(),
        color: 'green'
      }));

      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        height: 500,
        events: [...events, ...upcoming]
      });
      calendar.render();
    });
}

document.getElementById('fetchBtn')?.addEventListener('click', async () => {
  const handle = document.getElementById('handleInput').value.trim();
  if (!handle) return alert('⚠️ Please enter a handle.');
  loading.style.display = 'block';
  try {
    await fetchUser(handle);
  } catch (err) {
    console.error(err);
    document.getElementById('error').innerText = '❌ Failed to fetch user data.';
  } finally {
    loading.style.display = 'none';
  }
});

document.getElementById('compareBtn')?.addEventListener('click', async () => {
  const u1 = document.getElementById('handleInput').value.trim();
  const u2 = document.getElementById('handleInput2').value.trim();
  const u3 = document.getElementById('handleInput3')?.value.trim();
  const handles = [u1, u2];
  if (u3) handles.push(u3);

  const params = new URLSearchParams();
  handles.forEach((h, i) => params.append(`u${i + 1}`, h));

  const res = await fetch(`/api/user/compare?${params}`);
  const { timelines } = await res.json();

  const ctx = document.getElementById('ratingChart').getContext('2d');
  if (window.myChart) window.myChart.destroy();

  const colors = ['#3f51b5', '#f44336', '#4caf50'];
  const datasets = timelines.map((user, i) => ({
    label: user.handle,
    data: user.ratingTimeline.map(p => p.rating),
    borderColor: colors[i % colors.length],
    fill: false,
    tension: 0.3
  }));

  const labels = timelines[0]?.ratingTimeline.map(p => new Date(p.date).toLocaleDateString()) || [];

  window.myChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: { legend: { display: true }, tooltip: { mode: 'index' } },
      scales: { y: { beginAtZero: false } }
    }
  });
});

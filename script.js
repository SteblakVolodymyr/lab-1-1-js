const form = document.getElementById('motionForm');
const clearBtn = document.getElementById('clearBtn');
const canvas = document.getElementById('chartCanvas');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('status');
const tableBody = document.getElementById('resultTableBody');

const flightTimeEl = document.getElementById('flightTime');
const rangeValueEl = document.getElementById('rangeValue');
const maxHeightEl = document.getElementById('maxHeight');
const pointsCountEl = document.getElementById('pointsCount');

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

function round(value) {
  return Number(value).toFixed(2);
}

function validateInput(values) {
  if (values.timeStep <= 0) {
    throw new Error('Крок часу повинен бути більшим за 0.');
  }

  if (values.speed < 0) {
    throw new Error('Початкова швидкість не може бути від’ємною.');
  }

  if (values.acceleration <= 0) {
    throw new Error('Прискорення повинно бути більшим за 0.');
  }
} 

function calculateTrajectory(values) {
  const angleRad = toRadians(values.angle);
  let x = values.x0;
  let y = values.y0;
  let time = 0;
  let vx = values.speed * Math.cos(angleRad);
  let vy = values.speed * Math.sin(angleRad);
  const g = values.acceleration;
  const dt = values.timeStep;
  const points = [{ t: time, x, y }];
  let maxHeight = y;

  while (y >= 0 && points.length < 10000) {
    x += vx * dt;
    vy -= g * dt;
    y += vy * dt;
    time += dt;

    if (y < 0) {
      break;
    }

    maxHeight = Math.max(maxHeight, y);
    points.push({ t: time, x, y });
  }

  return {
    points,
    flightTime: time,
    range: points[points.length - 1].x - values.x0,
    maxHeight
  };
}

function drawAxes(maxX, maxY) {
  const padding = 50;
  const width = canvas.width - padding * 2;
  const height = canvas.height - padding * 2;

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.moveTo(padding, canvas.height - padding);
  ctx.lineTo(padding, padding);
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.font = '14px Arial';
  ctx.fillText('X, м', canvas.width - 65, canvas.height - padding - 10);
  ctx.fillText('Y, м', padding + 10, padding - 15);

  for (let i = 0; i <= 5; i++) {
    const x = padding + width * (i / 5);
    const y = canvas.height - padding - height * (i / 5);

    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, canvas.height - padding);
    ctx.moveTo(padding, y);
    ctx.lineTo(canvas.width - padding, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.fillText(round((maxX * i) / 5), x - 10, canvas.height - padding + 20);
    if (i < 5) {
      ctx.fillText(round((maxY * i) / 5), 10, canvas.height - padding - height * (i / 5) + 5);
    }
  }
}

function drawTrajectory(points) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const maxX = Math.max(...points.map(point => point.x), 1);
  const maxY = Math.max(...points.map(point => point.y), 1);
  const padding = 50;
  const width = canvas.width - padding * 2;
  const height = canvas.height - padding * 2;

  drawAxes(maxX, maxY);

  ctx.strokeStyle = '#174ea6';
  ctx.lineWidth = 2.5;
  ctx.beginPath();

  points.forEach((point, index) => {
    const canvasX = padding + (point.x / maxX) * width;
    const canvasY = canvas.height - padding - (point.y / maxY) * height;

    if (index === 0) {
      ctx.moveTo(canvasX, canvasY);
    } else {
      ctx.lineTo(canvasX, canvasY);
    }
  });

  ctx.stroke();
}

function renderTable(points) {
  const rows = points.slice(0, 15).map((point, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${round(point.t)}</td>
      <td>${round(point.x)}</td>
      <td>${round(point.y)}</td>
    </tr>
  `).join('');

  tableBody.innerHTML = rows || '<tr><td colspan="4" class="empty">Немає даних для відображення</td></tr>';
}

function renderMetrics(result) {
  flightTimeEl.textContent = `${round(result.flightTime)} с`;
  rangeValueEl.textContent = `${round(result.range)} м`;
  maxHeightEl.textContent = `${round(result.maxHeight)} м`;
  pointsCountEl.textContent = result.points.length;
}

function clearAll() {
  form.reset();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  tableBody.innerHTML = '<tr><td colspan="4" class="empty">Немає даних для відображення</td></tr>';
  flightTimeEl.textContent = '—';
  rangeValueEl.textContent = '—';
  maxHeightEl.textContent = '—';
  pointsCountEl.textContent = '—';
  statusText.textContent = 'Дані очищено. Введіть параметри заново.';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  try {
    const values = {
      x0: Number(document.getElementById('x0').value),
      y0: Number(document.getElementById('y0').value),
      angle: Number(document.getElementById('angle').value),
      speed: Number(document.getElementById('speed').value),
      acceleration: Number(document.getElementById('acceleration').value),
      timeStep: Number(document.getElementById('timeStep').value)
    };

    validateInput(values);
    const result = calculateTrajectory(values);
    drawTrajectory(result.points);
    renderTable(result.points);
    renderMetrics(result);
    statusText.textContent = 'Траєкторію успішно побудовано.';
  } catch (error) {
    statusText.textContent = error.message;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
});

clearBtn.addEventListener('click', clearAll);

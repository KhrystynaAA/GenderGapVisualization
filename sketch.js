// 全局变量
var font_type = 'Arial';   // 字体类型
var font_height = 14;      // 基础字号
var font_color = 'white';  // 默认文字颜色
var canvas_height = 5000;
var selectedIndex = -1;    // 当前选中项的索引
var sectors = [];          // 存储扇形区域信息
var currentCenterX, currentCenterY; // 当前图表中心坐标
var womenShare; // 女性比例数据
var panelWidth = 400; // 面板宽度
var panelHeight = 220; // 面板高度
let showExplanation = false;
let explanationButton;
let showAllLabels = false;   // 控制是否显示所有标签
let showLabelsButton;   

/*气泡*/
var bubbles = [];                  // 存储所有小气泡对象
var bubblesAnimating = false;      // 气泡动画是否正在进行
var bubbleAnimationStartTime = 0;  // 动画开始的时间（毫秒）
var bubbleAnimationDuration = 3000; // 动画持续 3 秒
var bubbleAnimationButton;         // 用于启动动画的按钮
let selectedBubbleIndex = -1;
let legendValueX, legendValueY;
// 数据存储
var table, majors, men, women, totals, maxLogValue;
let selectedIndexMajor = 0; // Індекс вибраної галузі
let selectMenu;
// 预加载CSV数据
function preload() {
  table = loadTable("data/women-stem.csv", "csv", "header");
}

// 初始化画布和数据
function setup() {

  createCanvas(windowWidth, canvas_height); // 动态画布尺寸
  angleMode(RADIANS);

  // 提取和处理数据列
  majors = table.getColumn("Major");
  men = table.getColumn("Men").map(Number);
  women = table.getColumn("Women").map(Number);
  totals = men.map((m, i) => m + women[i]);
  womenShare = table.getColumn("ShareWomen").map(Number);
  // 计算对数数值
  const logMenArr = men.map(v => Math.log(v + 1));
  const logWomenArr = women.map(v => Math.log(v + 1));
  maxLogValue = Math.max(...logMenArr, ...logWomenArr);
// Додаємо випадаючий список для вибору галузі
selectMenu = createSelect();
selectMenu.position(20, 20);

// Додаємо варіанти вибору
majors.forEach((major, index) => {
  selectMenu.option(major, index);
});

// Додаємо обробник зміни вибору
selectMenu.changed(() => {
  selectedIndexMajor = int(selectMenu.value());
  redraw(); // Оновлюємо графік
});

  // 设置文字样式
  textFont(font_type);
  textSize(font_height);

  setupBubbleAnimationButton();

}

// 窗口大小变化处理
function windowResized() {
  resizeCanvas(windowWidth, canvas_height);
}


// 主绘制循环
function draw() {
  background('#10032C');

  // 先绘制标题并获取标题高度
  const titleHeight = drawMainTitle();
  
  // 计算图表中心位置（下移）
  currentCenterX = width / 2;
  currentCenterY = titleHeight *2+width / 2;

  // 扇形图参数计算
  let majorCount = majors.length;
  let gap = radians(1.5);
  let startAngleGlobal = 0 * PI;
  let endAngleGlobal = 2 * PI;
  let totalSweep = endAngleGlobal - startAngleGlobal;
  let availableAngle = totalSweep - (gap * majorCount);
  let angleStep = availableAngle / majorCount;
  let maxRadius = min(currentCenterX, height - currentCenterY) * 0.7;

  sectors = [];


  // 绘制扇形图
  for (let i = 0; i < majorCount; i++) {
    // 计算扇形尺寸
    let logMen = Math.log(men[i] + 1);
    let logWomen = Math.log(women[i] + 1);
    let radiusMen = map(logMen, 0, maxLogValue, 0, maxRadius);
    let radiusWomen = map(logWomen, 0, maxLogValue, 0, maxRadius);
    
    let startAngle = startAngleGlobal + i * (angleStep + gap);
    let midAngle = startAngle + angleStep * 0.5;
    let endAngle = startAngle + angleStep;
    
    sectors.push({
      start: startAngle,
      end: endAngle,
      maxRadius: Math.max(radiusMen, radiusWomen),
      major: majors[i],
      midAngle: (startAngle + endAngle) / 2
    });

    // 绘制男性区块
    noStroke();
    fill('#722E60');
    arc(currentCenterX, currentCenterY, radiusMen * 2, radiusMen * 2, startAngle, midAngle, PIE);

    // 绘制女性区块
    fill('#E8BE92');
    arc(currentCenterX, currentCenterY, radiusWomen * 2, radiusWomen * 2, midAngle, endAngle, PIE);

    // 绘制扇形分隔线
    line(
      currentCenterX + cos(startAngle) * maxRadius,
      currentCenterY + sin(startAngle) * maxRadius,
      currentCenterX + cos(startAngle) * (maxRadius + 20),
      currentCenterY + sin(startAngle) * (maxRadius + 20)
    );
  }

  // 绘制其他图表元素
  if (selectedIndex !== -1) {
    drawSelectedLabel();
  }
 /* if (showAllLabels) {
    drawAllLabels();
  } else if (selectedIndex !== -1) {
    drawSelectedLabel();
  }*/

  drawScaleAnnotations(currentCenterX, currentCenterY);
  drawCenterCircle(currentCenterX, currentCenterY);
  drawLegend(currentCenterY, maxRadius);
  drawInfoPanel(); 
    
  if (showExplanation) {
    drawLogExplanation();
  }
    // 按钮在图表左下方
    drawExplanationButton(currentCenterX, currentCenterY, maxRadius);
   // drawShowLabelsButton(currentCenterX, currentCenterY, maxRadius);

   //气泡图
   drawBubbleChart();

}


// 绘制主标题
function drawMainTitle() {
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);

  let mainTitleSize = map(width, 500, 2500, 20, 35);
  textSize(mainTitleSize);
  let mainY = map(height, 500, 2000, 5, 10);

  text("How Does the Gender Gap Vary Across STEM Majors?", width / 2, mainY);

  let subTitleSize = map(width, 500, 2500, 15, 20);
  textSize(subTitleSize);
  fill(200);

  let subY = mainY + textAscent() *7;

  
  text("Gender Distribution of STEM Undergraduate Graduates in the XX Region for 20XX \n"
      + "The visualizations illustrate gender distribution across STEM majors, highlighting the proportion of men and women in each field.\n"
      + "This visualization is designed for educators, students, and researchers interested in gender representation in STEM education.\n"
      + "Understanding gender disparities in STEM helps identify trends, potential biases, and opportunities for promoting inclusivity in technical fields.\n"
      + "The main chart represents gender distribution in STEM fields using sector-based visualization.\n"
      + "The bubble chart categorizes STEM majors, where the size of bubbles corresponds to the total number of students, and the color indicates the percentage of women.\n"
      + "An interactive panel provides detailed statistics for selected fields.", 
      width / 2, subY);

  return subY + textAscent() * 6; 
}



// 计算扇形中心角度
function getSectorCenterAngle(i, angleStep, gap) {
  let startAngle = i * (angleStep + gap);
  return startAngle + angleStep / 2;
}

// 绘制中心虚线圆
function drawCenterCircle(currentCenterX, currentCenterY) {
  let centerRadius = (min(currentCenterX, height - currentCenterY))*0.7/3; // 动态半径
  fill('#10032C');
  stroke('#FBE8D1');
  strokeWeight(2);
  drawingContext.setLineDash([5, 5]);
  ellipse(currentCenterX, currentCenterY, centerRadius * 2);
  drawingContext.setLineDash([]);
}

// 绘制刻度注解
function drawScaleAnnotations(cx, cy) {
  let steps = 5;
  let maxRadius = min(width / 2, height - cy) * 0.7; // 动态调整半径
  fill(100);
  textAlign(CENTER, TOP);

  for (let i = 1; i <= steps; i++) {
    let r = maxRadius * (i / steps);
    let value = Math.exp(maxLogValue * (i / steps)) - 1;

    // 绘制刻度圆环
    noFill();
    stroke(120);
    strokeWeight(1);
    ellipse(cx, cy, r * 2); // 修正：

    // 动态调整注解位置
    let annotationX = cx+r;
    let annotationY = cy; // 微调Y位置避免重叠
    noStroke();
    fill(180);
    textSize(map(width, 500, 2500, 8, 10));
    text(nf(value, 0, 0), annotationX, annotationY);
  }
}


// 图例函数
function drawLegend(centerY, maxRadius) {
  const chartBottom = centerY + maxRadius;
  const legendMargin = 50;
  let legendX = width*4/5;
  let legendY = min(chartBottom + legendMargin, height - 100);
  let boxSize = 20;

  noStroke();
  
  // 绘制男性图例
  fill('#722E60');
  rect(legendX, legendY, boxSize*2, boxSize);
  fill(255);
  textSize(map(width, 500, 2500, 15, 30));
  text('Men', legendX  + boxSize*4, legendY);

  // 绘制女性图例
  fill('#E8BE92');
  rect(legendX, legendY + 80, boxSize*2, boxSize);
  fill(255);
  text('Women', legendX + boxSize*4, legendY + 80);
}


// --- 说明框 ---
function toggleExplanation() {
  showExplanation = !showExplanation;
  if (explanationButton) {
    explanationButton.html(showExplanation ? "Hide Explanation" : "Show Explanation");
  }
}

function drawLogExplanation() {
  const boxWidth = width * 2 / 3;
  const boxHeight = (2 / 3) * boxWidth;
  const explanationY = width / 2;

  // 绘制背景
  fill(0, 0, 0, 200);
  stroke(200);
  rect((width - boxWidth) / 2, explanationY, boxWidth, boxHeight, 10);

  // 绘制文字
  fill(255);
  textSize(map(width, 500, 2500, 15, 40));
  textAlign(LEFT, TOP);
  let lineY = explanationY + 20;
  const explanations = [
    "Visualization Note:",
    "- Radius calculation: log(value + 1)",
    "- Example scaling:",
    "  100 → " + Math.log(101).toFixed(1) + "  1000 → " + Math.log(1001).toFixed(1),
    "- Improves small values visibility"
  ];

  explanations.forEach(line => {
    text(line, (width - boxWidth) / 2 + 10, lineY);
    lineY += 30;
  });
}

function drawExplanationButton(centerX, centerY, maxRadius) {
  const buttonX = 50; // 固定在图表左侧
  const buttonY = centerY + maxRadius + 60; // 图表下方一定间距

  if (!explanationButton) {
    explanationButton = createButton("Show Explanation");
    explanationButton.mousePressed(toggleExplanation);
  }
  explanationButton.position(buttonX, buttonY);
}


// 绘制选中标签
function drawSelectedLabel() {
  let sector = sectors[selectedIndex];
  let labelSettings = {
    baseRadius: min(currentCenterX, height - currentCenterY) * 0.7 - 20,
    verticalRadiusBoost: 20,
    fontSize: map(width, 500, 2500, 4, 10),
    labelAlpha: 200,
    lineLength: map(width, 500, 2500, 200, 400),
    textPadding: map(width, 500, 2500, 30, 50)
  };
  
  let pos = calculateLabelPosition(
    currentCenterX,
    currentCenterY,
    sector.midAngle,
    labelSettings
  );
  
  // 绘制引导线
  stroke(255, 200);
  line(pos.startX, pos.startY, pos.textX, pos.textY);
  
  // 绘制文本
  fill(255);
  noStroke();
  textSize(map(width, 500, 2500, 8, 12));
  textAlign(pos.align, CENTER);
  text(sector.major, pos.textX, pos.textY);
  }
  
  // 计算标签位置
  function calculateLabelPosition(cx, cy, angle, settings) {
  let angleCos = cos(angle);
  let angleSin = sin(angle);
  let verticalRatio = abs(angleSin);
  
  let finalRadius = settings.baseRadius;
  if (verticalRatio > 0.99) {
    finalRadius += settings.verticalRadiusBoost * pow(verticalRatio, 100);
  }
  
  let isRight = angleCos > 0;
  let textX = cx + angleCos * finalRadius + (isRight ? settings.textPadding : -settings.textPadding);
  let textY = cy + angleSin * finalRadius;
  
  return {
    startX: cx + angleCos * (finalRadius - settings.lineLength),
    startY: cy + angleSin * (finalRadius - settings.lineLength),
    textX: textX,
    textY: textY,
    align: isRight ? LEFT : RIGHT
  };
  }
  
  // 鼠标点击事件处理
  function mousePressed() {
  selectedIndex = -1;
  
  // 计算鼠标相对位置
  let dx = mouseX - currentCenterX;
  let dy = mouseY - currentCenterY;
  let distance = sqrt(dx * dx + dy * dy);
  let angle = atan2(dy, dx);
  if (angle < 0) angle += TWO_PI;
  
  // 逆序检测上层元素
  for (let i = sectors.length - 1; i >= 0; i--) {
    let sector = sectors[i];
    if (angle >= sector.start && 
        angle <= sector.end && 
        distance <= sector.maxRadius) {
      selectedIndex = i;
      break;
    }
  }
  let prevSelection = selectedBubbleIndex;
  selectedBubbleIndex = -1;

  // 反向检测（优先选中上层气泡）
  for (let i = bubbles.length-1; i >= 0; i--) {
    let b = bubbles[i];
    if (dist(mouseX, mouseY, b.x, b.y) < b.r) {
      selectedBubbleIndex = (i === prevSelection) ? -1 : i;
      break;
    }
  }
  }
  
// 交互面板 
function drawInfoPanel() {
  let index = selectedIndexMajor;
  
  // 获取当前专业数据
  const major = majors[index];
  const menCount = men[index];
  const womenCount = women[index];
  const total = menCount + womenCount;
  const womenPercentage = womenCount / total;
  const menPercentage = 1 - womenPercentage;

  // 面板参数
  const panelWidth = currentCenterX * 18 / 10;
  const panelHeight = 200;
  const panelX = (currentCenterX * 2 - panelWidth) / 2;
  const panelY = drawMainTitle();

  // 绘制面板背景
  fill(0, 0, 0, 180);
  stroke(50);
  strokeWeight(1);
  rect(panelX, panelY, panelWidth, panelHeight, 10);

  // 专业名称（动态字体）
  /*fill(255);
  textSize(map(width, 500, 2500, 10, 25));
  textAlign(RIGHT, TOP);
  text(major, panelX + panelWidth - 20, panelY+5 );*/
    // Оновлення позиції випадаючого списку
  selectMenu.style('font-size', '16px');
  selectMenu.style('background-color', '#333');
  selectMenu.style('color', 'white');
  selectMenu.style('border', '1px solid #E9BE93');
  selectMenu.style('border-radius', '5px');
  selectMenu.style('padding', '5px 5px');

  selectMenu.position( panelX + panelWidth - selectMenu.elt.offsetWidth, panelY + 5); // Вирівнюємо праворуч
  

  // 参数设置
  const shapeSize = map(width, 100, 4500, 5, 20);
  const shapesPerRow = 100;
  const maxShapes = 100;
  const baseY = panelY;

  // 女性比例可视化
  const displayWomen = Math.round(womenPercentage * maxShapes);
  for (let i = 0; i < displayWomen; i++) {
    fill('#E9BE93');
    const x = panelX + 20 + (i % shapesPerRow) * (shapeSize + 4);
    const y = baseY + panelHeight * 1 / 5 + Math.floor(i / shapesPerRow) * (shapeSize + 8);
    rect(x, y, shapeSize, shapeSize);
  }
  fill(255);
  textSize(map(width, 500, 2500, 10, 12));
  textAlign(LEFT, CENTER);
  text('Women', panelX-20 , baseY + panelHeight * 1 / 5 );

  // 男性比例可视化
  const displayMen = Math.round(menPercentage * maxShapes);
  for (let i = 0; i < displayMen; i++) {
    fill('#722E61');
    const x = panelX + 20 + (i % shapesPerRow) * (shapeSize + 4);
    const y = baseY + shapeSize + panelHeight * 2 / 5 + Math.floor(i / shapesPerRow) * (shapeSize + 8);
    rect(x, y, shapeSize, shapeSize);
  }
  fill(255);
  textSize(map(width, 500, 2500, 10, 12));
  textAlign(LEFT, CENTER);
  text('Men', panelX-10 , baseY + shapeSize + panelHeight * 2 / 5 );

  // 比例条形图参数
  const barY = baseY + panelHeight * 0.75+10;
  const barHeight = 10;
  const barWidth = panelWidth - 40;
  const barStartX = panelX + 20;

  // 创建渐变条
  let gradient = drawingContext.createLinearGradient(
    barStartX, barY,
    barStartX + barWidth, barY
  );

  const softEdge = 0.005; // 0.5% 过渡范围模拟白线渐变效果

  // 左侧颜色过渡
  gradient.addColorStop(0, '#E9BE93');
  gradient.addColorStop(womenPercentage - softEdge, '#AE777A');

  // 白线分界
  gradient.addColorStop(womenPercentage, '#FFFFFF');

  // 右侧颜色过渡
  gradient.addColorStop(womenPercentage + softEdge, '#AE777A');
  gradient.addColorStop(1, '#722E61');

  drawingContext.fillStyle = gradient;
  rect(barStartX, barY, barWidth, barHeight);

  // 百分比文本（动态字体）
  fill(255);
  textSize(map(width, 500, 2500, 10, 15));
  textAlign(CENTER, CENTER);
  text(nf(womenPercentage * 100, 0, 1) + '% Women', panelX + panelWidth / 2, barY+5);

  // 如果需要，也可以在比例条下方再次显示具体人数
  fill(255);
  textSize(map(width, 500, 2500, 10, 14));
  textAlign(CENTER, CENTER);
  text('Man: ' + menCount + '   Woman: ' + womenCount+ '   Total: ' + total, panelX + panelWidth / 2, barY + 25);
}






/*
function toggleLabels() {
  showAllLabels = !showAllLabels;
  if (showLabelsButton) {
    showLabelsButton.html(showAllLabels ? "Hide All Labels" : "Show All Labels");
  }
}

function drawAllLabels() {
  for (let i = 0; i < sectors.length; i++) {
    let sector = sectors[i];
    let labelSettings = {
      baseRadius: min(currentCenterX, height - currentCenterY) * 0.7 - 20,
      verticalRadiusBoost: 20,
      fontSize: map(width, 500, 2500, 4, 10),
      labelAlpha: 200,
      lineLength: map(width, 500, 2500, 200, 400),
      textPadding: map(width, 500, 2500, 30, 50)
    };
    let pos = calculateLabelPosition(currentCenterX, currentCenterY, sector.midAngle, labelSettings);
    
    // 绘制引导线
    stroke(255, 200);
    line(pos.startX, pos.startY, pos.textX, pos.textY);
    
    // 绘制标签文本
    fill(255);
    noStroke();
    textSize(map(width, 500, 2500, 8, 12));
    textAlign(pos.align, CENTER);
    text(sector.major, pos.textX, pos.textY);
  }
}
*/

//气泡
// 在 initBubbles() 中调整初始速度和气泡半径映射范围
function initBubbles() {
  bubbles = [];
  const bubbleChartHeight = 300;
  const bubbleChartY = drawMainTitle() *2+width+10;
  const clusterMarginX = 50;
  let majorCategories = table.getColumn("Major_category");
  let uniqueCategories = [...new Set(majorCategories)];
  let clusterWidth = (width - 2 * clusterMarginX) / uniqueCategories.length;
  
  // 计算全局最大总人数，用于映射气泡大小
  let maxTotal = 0;
  for (let i = 0; i < table.getRowCount(); i++) {
    let tot = Number(table.getString(i, "Men")) + Number(table.getString(i, "Women"));
    if (tot > maxTotal) maxTotal = tot;
  }
  
  // 调整气泡半径映射范围，使圆更大且差异明显
  let minBubbleRadius = 10;  // 之前为 5
  let maxBubbleRadius = 60;  // 之前为 20
  
  // 遍历各大专业类别，生成对应类别区域内的气泡对象
  for (let i = 0; i < uniqueCategories.length; i++) {
    let cat = uniqueCategories[i];
    let clusterX = clusterMarginX + i * clusterWidth;
    let clusterCenter = {
      x: clusterX + clusterWidth / 2,
      y: bubbleChartY + bubbleChartHeight / 2
    };
    // 遍历 CSV 每一行，若属于当前大类则创建气泡对象
    for (let j = 0; j < table.getRowCount(); j++) {
      if (table.getString(j, "Major_category") === cat) {
        let tot = Number(table.getString(j, "Men")) + Number(table.getString(j, "Women"));
        let share = Number(table.getString(j, "ShareWomen"));
        let r = map(tot, 0, maxTotal, minBubbleRadius, maxBubbleRadius);
        // 初始位置：在该聚集区域内随机分布
        let x = random(clusterX, clusterX + clusterWidth);
        let y = random(bubbleChartY, bubbleChartY + bubbleChartHeight);
        // 初始随机速度减小，使运动速度更慢
        let vx = random(-1, 1);  // 修改前：random(-3, 3)
        let vy = random(-1, 1);  // 修改前：random(-3, 3)
        bubbles.push({
          x: x,
          y: y,
          vx: vx,
          vy: vy,
          r: r,
          major: table.getString(j, "Major"),
          womenShare: share,
          category: cat,
          target: clusterCenter  // 最终吸引到该类别区域中心
        });
      }
    }
  }
}



/* ===== 新增：气泡物理模拟更新（包含吸引和排斥作用） ===== */
function updateBubbles() {
  let dt = 1;
  let attractionStrength = 0.02;  // 修改前为 0.05
  let repulsionStrength = 0.3;    // 修改前为 0.5
  let damping = 0.98;             // 修改前为 0.95
  
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    // 向目标中心的吸引力
    let fx = (b.target.x - b.x) * attractionStrength;
    let fy = (b.target.y - b.y) * attractionStrength;
    
    // 同类别气泡之间的排斥力
    for (let j = 0; j < bubbles.length; j++) {
      if (i === j) continue;
      let b2 = bubbles[j];
      if (b.category !== b2.category) continue;
      let dx = b.x - b2.x;
      let dy = b.y - b2.y;
      let dist = sqrt(dx * dx + dy * dy);
      let minDist = b.r + b2.r;
      if (dist < minDist && dist > 0) {
        let overlap = minDist - dist;
        fx += (dx / dist) * repulsionStrength * overlap;
        fy += (dy / dist) * repulsionStrength * overlap;
      }
    }
    // 更新速度并施加阻尼
    b.vx = (b.vx + fx * dt) * damping;
    b.vy = (b.vy + fy * dt) * damping;
  }
  
  // 更新所有气泡的位置
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
}


/* ===== 绘制气泡 ===== */
function drawBubbles() {
  // 先绘制所有气泡本体
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    let bubbleColor = lerpColor(color('#FFC0CB'), color('#8B0000'), b.womenShare);
    noStroke();
    fill(bubbleColor);
    ellipse(b.x, b.y, b.r * 2);
  }

  // 分层绘制标签（先小气泡后大气泡）
  bubbles.sort((a, b) => a.r - b.r); 
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    if (i !== selectedBubbleIndex) {
      drawSmartLabel(b);
    }
  }

  // 最后绘制选中标签
  if (selectedBubbleIndex !== -1) {
    let b = bubbles[selectedBubbleIndex];
    push();
    stroke(255, 200);
    strokeWeight(2);
    fill(0);
    textSize(12);
    drawSmartLabel(b, true);
    pop();
  }
}

// 智能标签绘制（带防重叠检测）
function drawSmartLabel(b, isSelected=false) {
  let labelPadding = 5;
  let labelX = b.x;
  let labelY = b.y + b.r + 15;
  
  // 检测与其他标签的碰撞
  let canDraw = true;
  for (let other of bubbles) {
    if (other === b) continue;
    let otherLabelY = other.y + other.r + 15;
    if (abs(labelY - otherLabelY) < 15 && 
        abs(labelX - other.x) < textWidth(b.major)/2 + textWidth(other.major)/2) {
      canDraw = false;
      break;
    }
  }

  if (canDraw || isSelected) {
    push();
    fill(255, isSelected ? 255 : 150);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(map(b.r, 10, 40, 8, 12));
    text(b.major, labelX, labelY);
    pop();
  }
}

/* ===== 修改：绘制气泡图（含动画更新逻辑） ===== */
function drawBubbleChart() {
  const bubbleChartHeight = 300;
  const bubbleChartY =drawMainTitle() *2+width+10;

  // 绘制气泡图背景
  noStroke();
  fill(20);
  rect(0, bubbleChartY, width, bubbleChartHeight);
  
  // 绘制大专业类别标签（显示在聚集区域顶部）
  let majorCategories = table.getColumn("Major_category");
  let uniqueCategories = [...new Set(majorCategories)];
  const clusterMarginX = 50;
  let clusterWidth = (width - 2 * clusterMarginX) / uniqueCategories.length;

  for (let i = 0; i < uniqueCategories.length; i++) {
    let cat = uniqueCategories[i];
    let clusterX = clusterMarginX + i * clusterWidth;
    let centerX = clusterX + clusterWidth / 2;
    fill(255);
    textSize(14);
    textAlign(CENTER, BOTTOM);
    text(cat, centerX, bubbleChartY + 20);  // Display the category name at the top of the region
  }
  
  // 若动画正在进行，则更新气泡位置
  if (bubblesAnimating) {
    updateBubbles();
    // 超过动画时长后冻结运动
    if (millis() - bubbleAnimationStartTime >= bubbleAnimationDuration) {
      bubblesAnimating = false;
      for (let i = 0; i < bubbles.length; i++) {
        bubbles[i].vx = 0;
        bubbles[i].vy = 0;
      }
    }
  }

  drawBubbles();
  drawBubbleLegend(bubbleChartY + bubbleChartHeight + 10);
}

/* ===== 新增：设置气泡动画启动按钮 ===== */
function setupBubbleAnimationButton() {
  bubbleAnimationButton = createButton("Click to start viewing");
  bubbleAnimationButton.position(50,drawMainTitle() *2+width+50);
  bubbleAnimationButton.mousePressed(() => {
    initBubbles();
    bubblesAnimating = true;
    bubbleAnimationStartTime = millis();
  });
}
//图例
function drawBubbleLegend(legendY) {
  const legendX = width - 200;
  const legendWidth = 100;
  const legendHeight = 20;

  // 绘制渐变条
  let gradient = drawingContext.createLinearGradient(
    legendX, legendY, 
    legendX + legendWidth, legendY
  );
  gradient.addColorStop(0, '#FFC0CB');
  gradient.addColorStop(1, '#8B0000');
  drawingContext.fillStyle = gradient;
  noStroke();
  rect(legendX, legendY, legendWidth, legendHeight);

  // 添加动态数值显示框
  if (selectedBubbleIndex !== -1) {
    let share = bubbles[selectedBubbleIndex].womenShare * 100;
    fill(50);
    rect(legendX, legendY - 25, legendWidth, 20);
    fill(255);
    textAlign(CENTER, CENTER);
    text(nf(share, 0, 1) + "%", legendX + legendWidth/2, legendY - 15);
  }

  // 添加刻度
  fill(255);
  textSize(8);
  textAlign(LEFT, TOP);
  text("0%", legendX, legendY + 5);
  textAlign(RIGHT, TOP);
  text("100%", legendX + legendWidth, legendY + 5);

  //图名
  fill(255);
  textSize(15);
  textAlign(CENTER);
  text("Proportional Distribution of Women Across Professions", width/2, legendY +20);
}
// ===== 3. 增强点击交互 =====


document
  .getElementById("imageUpload")
  .addEventListener("change", function (event) {
    let reader = new FileReader();
    reader.onload = function () {
      let img = new Image();
      img.onload = function () {
        initializeColorPickers(4); // default to 4 colors
        displayOriginalImage(img);
      };
      img.src = reader.result;
      window.uploadedImage = img;
    };
    reader.readAsDataURL(event.target.files[0]);
  });

function loadSavedState() {
  let savedImage = localStorage.getItem("uploadedImage");
  if (savedImage) {
    let img = new Image();
    img.onload = function () {
      window.uploadedImage = img;
      displayOriginalImage(img);
      loadColorsAndThresholds();
    };
    img.src = savedImage;
  }
}

function loadColorsAndThresholds() {
  let savedColors = JSON.parse(localStorage.getItem("colors"));
  let savedThresholds = JSON.parse(localStorage.getItem("thresholds"));
  if (savedColors && savedThresholds) {
    initializeColorPickers(savedColors.length);
    for (let i = 0; i < savedColors.length; i++) {
      document.getElementById("color" + i).value = savedColors[i];
      document.getElementById("threshold" + i).value = Number(
        savedThresholds[i]
      );
      document.getElementById("thresholdValue" + i).textContent = Number(
        savedThresholds[i]
      );
    }
    updateImages(); // Regenerate the images
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadSavedState();
});

function initializeColorPickers(numColors) {
  let container = document.getElementById("colorSelectors");
  container.innerHTML = "";
  for (let i = 0; i < numColors; i++) {
    let colorPicker = document.createElement("input");
    colorPicker.type = "color";
    colorPicker.id = "color" + i;
    colorPicker.addEventListener("input", updateImages);
    colorPicker.className = "colorPicker";
    container.appendChild(colorPicker);

    let thresholdSlider = document.createElement("input");
    thresholdSlider.type = "range";
    thresholdSlider.min = "0";
    thresholdSlider.max = "250";
    thresholdSlider.value = "10";
    thresholdSlider.id = "threshold" + i;
    thresholdSlider.addEventListener("input", updateImages);
    thresholdSlider.className = "thresholdSlider";
    thresholdSlider.addEventListener("change", saveCurrentState);
    container.appendChild(thresholdSlider);

    let thresholdValue = document.createElement("span");
    thresholdValue.id = "thresholdValue" + i;
    thresholdValue.textContent = thresholdSlider.value;
    thresholdSlider.oninput = function () {
      thresholdValue.textContent = this.value;
    };
    container.appendChild(thresholdValue);
  }
}

let originalImageCanvas = document.createElement("canvas");

function displayOriginalImage(image) {
  let container = document.getElementById("resultImages");
  container.innerHTML = ""; // Clear previous images
  let imgDiv = document.createElement("div");
  imgDiv.style.position = "relative";
  imgDiv.style.width = image.width + "px";
  imgDiv.style.height = image.height + "px";

  // make image non-draggable
  image.ondragstart = function () {
    return false;
  };

  image.style.position = "absolute";
  image.style.top = "0";
  image.style.left = "0";
  image.style.zIndex = "-1";

  imgDiv.appendChild(image);

  let ctx = originalImageCanvas.getContext("2d");
  originalImageCanvas.width = image.width;
  originalImageCanvas.height = image.height;
  //   ctx.drawImage(image, 0, 0);
  imgDiv.appendChild(originalImageCanvas);

  let isDrawing = false; // Variable to track whether the mouse is down or not

  // Event listener for mouse down
  originalImageCanvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    draw(e);
  });

  // Event listener for mouse move
  originalImageCanvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
      draw(e);
    }
  });

  // Event listener for mouse up
  originalImageCanvas.addEventListener("mouseup", () => {
    isDrawing = false;
    ctx.pathStarted = false; // Reset the flag
  });

  function draw(e) {
    // Get the mouse coordinates relative to the canvas
    const x = e.clientX - originalImageCanvas.getBoundingClientRect().left;
    const y = e.clientY - originalImageCanvas.getBoundingClientRect().top;

    // Set the drawing style (e.g., line color, thickness)
    ctx.strokeStyle = "black";
    ctx.lineWidth = 15;
    ctx.lineCap = "round";

    // Start or continue the drawing path
    if (!ctx.pathStarted) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.pathStarted = true;
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }

  // Clear the drawing when needed
  function clearCanvas() {
    ctx.clearRect(0, 0, originalImageCanvas.width, originalImageCanvas.height);
  }

  let label = document.createElement("p");
  label.textContent = "Original Image";
  imgDiv.appendChild(label);
  container.appendChild(imgDiv);
}

function saveCurrentState() {
  if (!window.uploadedImage) return;
  let colors = [];
  let thresholds = [];
  let numColors =
    document.getElementById("colorSelectors").childElementCount / 3;
  for (let i = 0; i < numColors; i++) {
    colors.push(document.getElementById("color" + i).value);
    thresholds.push(document.getElementById("threshold" + i).value);
  }
  localStorage.setItem("uploadedImage", window.uploadedImage.src);
  localStorage.setItem("colors", JSON.stringify(colors));
  localStorage.setItem("thresholds", JSON.stringify(thresholds));
}

function updateImages() {
  document.getElementById("resultImages").innerHTML = ""; // Clear previous results
  displayOriginalImage(window.uploadedImage); // Display original image again
  let numColors =
    document.getElementById("colorSelectors").childElementCount / 3; // Adjusted for color picker, slider, and label
  for (let i = 0; i < numColors; i++) {
    let color = document.getElementById("color" + i).value;
    let threshold = document.getElementById("threshold" + i).value;
    createThresholdImage(color, i, threshold);
  }
  createSuperimposedImage();
  // Do not save state here to avoid saving incomplete state
}

function createThresholdImage(hexColor, index, threshold) {
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  canvas.width = window.uploadedImage.width;
  canvas.height = window.uploadedImage.height;
  ctx.drawImage(window.uploadedImage, 0, 0);

  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let thresholdColor = hexToRgb(hexColor);

  for (let i = 0; i < imageData.data.length; i += 4) {
    let r = imageData.data[i];
    let g = imageData.data[i + 1];
    let b = imageData.data[i + 2];
    if (
      colorDistance(
        r,
        g,
        b,
        thresholdColor.r,
        thresholdColor.g,
        thresholdColor.b
      ) <= threshold
    ) {
      imageData.data[i + 3] = 255; // fully opaque
    } else {
      imageData.data[i + 3] = 0; // fully transparent
    }
  }

  ctx.putImageData(imageData, 0, 0);

  let imgDiv = document.createElement("div");
  imgDiv.appendChild(canvas);
  let label = document.createElement("p");
  label.textContent = `Processed Image - Color: ${hexColor.toUpperCase()}, Threshold: ${threshold}`;
  imgDiv.appendChild(label);
  document.getElementById("resultImages").appendChild(imgDiv);
}

function hexToRgb(hex) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function createSuperimposedImage() {
  if (!window.uploadedImage) return;

  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");
  canvas.width = window.uploadedImage.width;
  canvas.height = window.uploadedImage.height;

  let numColors =
    document.getElementById("colorSelectors").childElementCount / 3;

  for (let i = 0; i < numColors; i++) {
    let color = document.getElementById("color" + i).value;
    let threshold = document.getElementById("threshold" + i).value;

    // Create thresholded image for each color
    let colorLayer = getThresholdedImage(color, threshold);

    // Draw color layer onto the main canvas
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(colorLayer, 0, 0);
  }

  // Reset composite operation
  ctx.globalCompositeOperation = "source-over";

  let imgDiv = document.createElement("div");
  imgDiv.appendChild(canvas);
  let label = document.createElement("p");
  label.textContent = "Superimposed Image";
  imgDiv.appendChild(label);
  document.getElementById("resultImages").appendChild(imgDiv);
}

function getThresholdedImage(hexColor, threshold) {
  let tempCanvas = document.createElement("canvas");
  let tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = window.uploadedImage.width;
  tempCanvas.height = window.uploadedImage.height;
  tempCtx.drawImage(window.uploadedImage, 0, 0);

  let imageData = tempCtx.getImageData(
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  );
  let thresholdColor = hexToRgb(hexColor);

  // Apply the threshold and set the color
  for (let i = 0; i < imageData.data.length; i += 4) {
    let r = imageData.data[i];
    let g = imageData.data[i + 1];
    let b = imageData.data[i + 2];
    if (
      colorDistance(
        r,
        g,
        b,
        thresholdColor.r,
        thresholdColor.g,
        thresholdColor.b
      ) <= threshold
    ) {
      // Set the pixel to the chosen color
      imageData.data[i] = thresholdColor.r;
      imageData.data[i + 1] = thresholdColor.g;
      imageData.data[i + 2] = thresholdColor.b;
      imageData.data[i + 3] = 255; // fully opaque
    } else {
      imageData.data[i + 3] = 0; // fully transparent
    }
  }

  tempCtx.putImageData(imageData, 0, 0);
  return tempCanvas;
}

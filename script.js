document
  .getElementById("imageUpload")
  .addEventListener("change", function (event) {
    let reader = new FileReader();
    reader.onload = function () {
      let img = new Image();
      img.onload = function () {
        initializeColorPickers(3); // default to 3 colors
        displayOriginalImage(img);
      };
      img.src = reader.result;
      window.uploadedImage = img;
    };
    reader.readAsDataURL(event.target.files[0]);
  });

function initializeColorPickers(numColors) {
  let container = document.getElementById("colorSelectors");
  container.innerHTML = "";
  for (let i = 0; i < numColors; i++) {
    let colorPicker = document.createElement("input");
    colorPicker.type = "color";
    colorPicker.id = "color" + i;
    colorPicker.oninput = updateImages;
    container.appendChild(colorPicker);

    let thresholdSlider = document.createElement("input");
    thresholdSlider.type = "range";
    thresholdSlider.min = "0";
    thresholdSlider.max = "50";
    thresholdSlider.value = "10";
    thresholdSlider.id = "threshold" + i;
    thresholdSlider.oninput = updateImages;
    container.appendChild(thresholdSlider);
  }
}

function displayOriginalImage(image) {
  let container = document.getElementById("resultImages");
  container.innerHTML = ""; // Clear previous images
  let imgDiv = document.createElement("div");
  imgDiv.appendChild(image);
  let label = document.createElement("p");
  label.textContent = "Original Image";
  imgDiv.appendChild(label);
  container.appendChild(imgDiv);
}

function updateImages() {
  document.getElementById("resultImages").innerHTML = ""; // Clear previous results
  displayOriginalImage(window.uploadedImage); // Display original image again
  let numColors =
    document.getElementById("colorSelectors").childElementCount / 2; // Dividing by 2 as we now have two inputs per color
  for (let i = 0; i < numColors; i++) {
    let color = document.getElementById("color" + i).value;
    let threshold = document.getElementById("threshold" + i).value;
    createThresholdImage(color, i, threshold);
  }
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

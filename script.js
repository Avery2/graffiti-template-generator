document
  .getElementById("imageUpload")
  .addEventListener("change", function (event) {
    let reader = new FileReader();
    reader.onload = function () {
      let img = new Image();
      img.onload = function () {
        initializeColorPickers(3); // default to 3 colors
        document.getElementById("resultImages").innerHTML = "";
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
    container.appendChild(colorPicker);
  }
}

function processImage() {
  let numColors = document.getElementById("colorSelectors").childElementCount;
  for (let i = 0; i < numColors; i++) {
    let color = document.getElementById("color" + i).value;
    createThresholdImage(color, i);
  }
}

function createThresholdImage(hexColor, index) {
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
      ) <= 10
    ) {
      imageData.data[i + 3] = 255; // fully opaque
    } else {
      imageData.data[i + 3] = 0; // fully transparent
    }
  }

  ctx.putImageData(imageData, 0, 0);

  document.getElementById("resultImages").appendChild(canvas);
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

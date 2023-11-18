window.onload = function() {
    const imageInput = document.getElementById('imageInput');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    imageInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                applyColorThresholding(ctx, img.width, img.height);
            }
            img.src = e.target.result;
        }
        reader.readAsDataURL(file);
    });
}

function applyColorThresholding(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        // Adjust these ranges according to your needs
        if (red > 100 && green < 80 && blue < 80) { // Simple red color threshold
            // Highlight color in white
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
        } else {
            // Dim other colors
            data[i] = data[i + 1] = data[i + 2] = 0;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

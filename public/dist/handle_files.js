document.querySelectorAll('.edit-delete-button').forEach(button => {
  button.addEventListener('click', async () => {
      const imageId = button.dataset.imageId; // Assuming the image ID is stored in a data attribute
      console.log(imageId)

      try {
          const response = await fetch(`/delete-image/${imageId}`, {
              method: 'DELETE'
          });
          if (response.ok) {
            // Image deleted successfully
            
            alert('Image deleted successfully');
            window.location.reload(true);

            // Remove the image from the HTML
            const imageContainer = button.closest('.gallery-edit-item'); // Find the closest parent container
            imageContainer.remove(); // Remove the container from the DOM
          } else {
            // Failed to delete image
            alert('Failed to delete image, Try again later');
          }
      } catch (error) {
          console.error('Error deleting image:', error);
      }
  });
});

document.addEventListener('DOMContentLoaded', function() {
  // Add event listener to all upload buttons
  const uploadButtons = document.querySelectorAll('.uploadButton');
  uploadButtons.forEach(uploadButton => {
    uploadButton.addEventListener('click', () => {
      // Find the corresponding file input and album hash input
      const fileInput = uploadButton.parentElement.querySelector('.fileInput');
      const albumHashInput = uploadButton.parentElement.querySelector('.albumHash');

      // Check if albumHashInput exists
      if (!albumHashInput) {
        console.error('Album hash input not found');
        return;
      }

      // Trigger click event on the file input
      fileInput.click();
    });
  });

  // Add event listener to all file inputs for file selection
  const fileInputs = document.querySelectorAll('.fileInput');
  fileInputs.forEach(fileInput => {
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return; // No file selected

      try {
        // Find the corresponding album hash input and retrieve the value
        const albumHashInput = fileInput.parentElement.querySelector('.albumHash');
        if (!albumHashInput) {
          console.error('Album hash input not found');
          return;
        }
        const albumHash = albumHashInput.value;

        // Create a FormData object to hold the file and album hash
        const formData = new FormData();
        formData.append('image', file);
        formData.append('album', albumHash);

        // Send a POST request to the server to upload the image
        const response = await fetch('/add-image', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const imageUrl = data.imageUrl;
          alert('Image uploaded successfully')
          window.location.reload(true);

          // Optionally, you can also update UI or perform other actions with the image URL
          console.log('Image uploaded successfully:', imageUrl);
          
        } else {
          console.error('Failed to upload image, Try again later');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    });
  });
});

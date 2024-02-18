function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements at i and j
  }
  return array;
}

function ramdomizeSize(){
  document.querySelectorAll('.my-image').forEach(image => {
    const windowWidth = window.innerWidth;
    if (windowWidth < 768) {
      image.style.maxWidth = '50%';
      const randomValue = (Math.floor(Math.random() * 3) + 2).toString()
      const scale = 'w-1/'+randomValue
      image.classList.add(scale)
    } else {
      image.style.maxWidth = '40%';
      const randomValue = (Math.floor(Math.random() * 3) + 4).toString()
      const scale = 'w-1/'+randomValue
      image.classList.add(scale)
    }
  });
}

function portfolioSize(){
  document.querySelectorAll('.portfolio-image').forEach(image => {
    const windowWidth = window.innerWidth;
    if (windowWidth < 768) {
      image.style.maxWidth = '50%';
    } else {
      image.style.maxWidth = '40%';
      const randomValue = (Math.floor(Math.random() * 3) + 4).toString()
      const scale = 'w-1/'+randomValue
      image.classList.add(scale)
    }
  });
}

portfolioSize();

function allImages(){
  const allImagesInput = document.querySelector('#allImages'); // Assuming you have given the hidden input field an ID of "allImages"
  const allImagesString = allImagesInput.value;
  const allImages = JSON.parse(allImagesString); // Parse the JSON string back into a JavaScript array
  const shuffledImages = shuffleArray(allImages);
  const galleryContainer = document.getElementById('gallery-container');
  
  // Remove existing sections
  document.querySelectorAll('.gallery-section').forEach(element => {
    element.classList.add('hidden');
  });

  // Create and append new sections with shuffled images
  const section = document.createElement('section');
  section.classList.add('gallery-section', 'text-neutral-700');
  section.id = 'all'; // Set the id of the container section
  galleryContainer.appendChild(section); // Append the container section to the gallery container
  const allTitle = document.createElement('h1');
  allTitle.classList.add('text-3xl', 'pt-10', 'pb-8')
  allTitle.innerHTML = 'All';
  const wholeContainer = document.createElement('div');
  wholeContainer.classList.add('container', 'w-full');
  const secondContainer = document.createElement('div');
  secondContainer.classList.add('flex', 'flex-wrap', 'justify-start');
  wholeContainer.appendChild(secondContainer);
  section.appendChild(allTitle);
  section.appendChild(wholeContainer);

  shuffledImages.forEach(image => {

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('my-image', 'flex-grow', 'p-2');
    const anchor = document.createElement('a');
    anchor.href = image;
    anchor.dataset.fancybox = 'all'; 
    const img = document.createElement('img');
    img.alt = 'image';
    img.classList.add('border-radius', 'block', 'h-full', 'w-full', 'object-cover', 'object-center', 'opacity-100', 'animate-fade-in', 'transition', 'duration-500', 'transform', 'scale-100', 'hover:scale-110');
    img.src = image;
    anchor.appendChild(img);
    imageContainer.appendChild(anchor);
    secondContainer.appendChild(imageContainer);
    
  });
  ramdomizeSize();
}

allImages();
  
  // Add click event listeners to the buttons
document.querySelectorAll('.portfolio-menu button.btn').forEach(button => {

    button.addEventListener('click', function() {
      // Remove 'active' class from all buttons
      document.querySelectorAll('.portfolio-menu button.btn').forEach(btn => {
        btn.classList.remove('active');
      });
      // Add 'active' class to the clicked button
      this.classList.add('active');
      
      // Filter albums based on the data-filter attribute
      const filter = this.getAttribute('data-filter');
      if (filter === "*") {
        allImages();
      } else {
        document.querySelectorAll('.gallery-section').forEach(section => {
          const albumName = section.getAttribute('id'); // Get the id of the section
          
            if (albumName !== filter) {
              section.classList.add('hidden'); // Show sections that match the filter
            } else {
              section.classList.remove('hidden'); // Hide sections that don't match the filter
            }    
        });
      }  
    });
});


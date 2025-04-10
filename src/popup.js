document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('eyeForm');
  const options = document.querySelectorAll('.eye-option');
  const leftPreviewEye = document.querySelector('.left-eye');
  const rightPreviewEye = document.querySelector('.right-eye');
  
  // Update selected style
  function updateSelected() {
    const selectedValue = document.querySelector('input[name="eye"]:checked').value;
    
    // Update preview eyes to match selection
    if (selectedValue === 'none') {
      leftPreviewEye.style.display = 'none';
      rightPreviewEye.style.display = 'none';
    } else {
      leftPreviewEye.style.display = 'block';
      rightPreviewEye.style.display = 'block';
      leftPreviewEye.src = `/src/images/${selectedValue}.png`;
      rightPreviewEye.src = `/src/images/${selectedValue}.png`;
    }
    
    options.forEach(opt => {
      const isSelected = opt.querySelector('input').checked;
      opt.classList.toggle('selected', isSelected);
    });
  }
  
  // Load current selection from storage
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    const tabId = tabs[0].id;
    chrome.storage.session.get([`tab_${tabId}`], result => {
      let selection = result[`tab_${tabId}`];
      form.elements.eye.value = selection || 'none';
      if (!selection) {
        chrome.storage.session.set({ [`tab_${tabId}`]: 'none' });
        chrome.runtime.sendMessage({
          action: "enable",
          tabId: tabId,
        });
      }
      updateSelected();
    });
  });
  
  // Handle option clicks
  options.forEach(option => {
    option.addEventListener('click', function() {
      const radio = this.querySelector('input');
      radio.checked = true;
      updateSelected();
      
      const selectedEye = radio.value;
      chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        const tabId = tabs[0].id;
        chrome.storage.session.set({ [`tab_${tabId}`]: selectedEye });
        
        chrome.tabs.sendMessage(tabId, {
          eye: selectedEye
        });
      });
    });
  });
});
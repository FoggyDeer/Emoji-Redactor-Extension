const regex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
function replaceEmoji(asset) {
  const textNodes = getTextNodes();
  for (const node of textNodes) {
    const modifiedText = node.textContent.replace(regex, asset);
    if(document.body.contains(node) && node.parentNode)
      node.parentNode.innerHTML = modifiedText;
  }
}

function getTextNodes() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  while (walker.nextNode()) {
    if(regex.test(walker.currentNode.textContent))
      textNodes.push(walker.currentNode);
  }
  return textNodes;
}

const fileInput = document.querySelector("#fileInput");
const saveButton = document.querySelector("#saveButton");

saveButton.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!(file instanceof Blob)) {
    console.error("The selected file is not a Blob.");
    return;
  }

  const fileReader = new FileReader();

  fileReader.addEventListener("load", () => {
    const imageData = fileReader.result;
    chrome.storage.sync.set({
      image: imageData
    });

    chrome.storage.sync.get("image", function (data) {
      var image = new Image();
      image.src = data.image;
      document.body.appendChild(image);
    });
  });

  fileReader.readAsDataURL(file);
});
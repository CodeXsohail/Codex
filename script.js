let menuIcon = document.querySelector("#menu-icon");
let navlist = document.querySelector(".navlist");

menuIcon.onclick = () => {
  menuIcon.classList.toggle("bx-x");
  navlist.classList.toggle("show");
};

// Close navlist if clicked outside menu-icon and navlist
document.addEventListener("click", (event) => {
  if (!navlist.contains(event.target) && !menuIcon.contains(event.target)) {
    navlist.classList.remove("show");
    menuIcon.classList.toggle("bx-x");
  }
});

const inputs = document.querySelectorAll("input");
inputs.forEach((input) => {
  input.addEventListener("focus", () => {
    setTimeout(() => {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  });
});

fetch("codex_rules.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("rules-section").innerHTML = data;
  })
  .catch((error) => console.error("Error loading rules:", error));


function toggleContent(id) {
  const content = document.getElementById(id); // Correctly select the element using its id
  if (content.classList.contains("visible")) {
    content.classList.remove("visible"); // Hide the content
  } else {
    content.classList.add("visible"); // Show the content
  }
}

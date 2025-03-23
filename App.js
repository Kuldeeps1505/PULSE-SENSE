document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("heartRateForm");
  const message = document.getElementById("message");

  form.addEventListener("submit", async function (event) {
      event.preventDefault(); // Prevent form from reloading the page

      // Get form data
      const formData = {
          name: document.getElementById("name").value,
          age: document.getElementById("age").value,
          gender: document.getElementById("gender").value,
          contact: document.getElementById("contact").value,
          heartRate: document.getElementById("heartRate").value
      };

      try {
          const response = await fetch("http://localhost:8080/api/heart-rate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData)
          });
          
          if (response.ok) {
            document.getElementById("message").innerText = "✅ Heart rate submitted successfully!";
        } else {
            document.getElementById("message").innerText = "❌ Submission failed.";
        }};
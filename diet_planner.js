
function addtocalender() {
    let title = document.getElementById("title").value;
    let content = document.getElementById("date").value;

    if (title.trim() === "" || content.trim() === "") {
        alert("Please fill all fields!");
        return;
    }
    alert("Meal added to calender!");
};









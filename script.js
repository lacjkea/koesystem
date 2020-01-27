window.addEventListener("load", start);

function start() {
    console.log('start');
    document.querySelector("#addToQue").addEventListener("click", addToQue);
    document.querySelector("#closePopup").addEventListener("click", closePopup);
    document.querySelector("#deleteList_1").addEventListener("click", deleteFromQue);
    document.querySelector("#readmore_1").addEventListener("click", readmore);
}

function addToQue() {
    console.log('addToQue');
    document.querySelector("#popupScreen").classList.remove("hide");
    document.querySelector("#add").classList.remove("hide");
}

function deleteFromQue() {
    console.log('deleteFromQue');
    document.querySelector("#popupScreen").classList.remove("hide");
    document.querySelector("#delete").classList.remove("hide");

}

function readmore() {
    document.querySelector("#popupScreen").classList.remove("hide");
    document.querySelector("#readmore").classList.remove("hide");
}

function addProblem() {

}

function closePopup() {
    document.querySelector("#popupScreen").classList.add("hide");
    document.querySelector("#add").classList.add("hide");
    document.querySelector("#delete").classList.add("hide");
    document.querySelector("#readmore").classList.add("hide");
}

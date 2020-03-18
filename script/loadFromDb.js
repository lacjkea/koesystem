window.addEventListener("load", start);

function start() {
    console.log('start');

    dataGet();

    document.querySelector("#closePopup").addEventListener("click", closePopup);

    document.querySelector("#insertProblemDialog").addEventListener("click", domDialogShowInsert);



}
function closePopup() {
    document.querySelector("#popupScreen").classList.add("hide");
   // document.querySelector("#insertProblem").addEventListener("click", domDialogShowInsert);
 
    domDialogReset();
 


}
function dataGet(){
    console.log("dataGet");
    fetch(dbUrl +"?metafields=true", {
        method: "get",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-apikey": apikey,
            "cache-control": "no-cache"
        }
    })
        .then(e => e.json())
        .then(e => {
            problems = e;
            
            problems.sort(function (a, b) {
                var x = a._created.toLowerCase();
                var y = b._created.toLowerCase();
                if (x < y) { return -1; }
                if (x > y) { return 1; }
                return 0;
            });




            console.table(problems);
        
            domDeleteRows();
            domShowContent(problems);
            closePopup();
        });
}
function dataUpdateRow(event, body,  updateId, deleteId ){
    console.log("dataUpdate: ", event,  body, updateId, deleteId);

    fetch(dbUrl + "/" + updateId, {


        method: "PATCH",

        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-apikey": apikey,
            "cache-control": "no-cache"
        },
        body: JSON.stringify(body),
        json: true
    }).then(e => e.json())
        .then(e => {

            if(updateId!=deleteId){
            dataDeleteRow(event, deleteId);
            } else {
                dataGet();
            }
        });

}
function dataDeleteRow(event, id) {
    console.log("eventhandler", event, id);

         fetch(dbUrl + "/" + id, {

             method: "delete",
             headers: {
                 "Content-Type": "application/json; charset=utf-8",
                 "x-apikey": apikey,
                 "cache-control": "no-cache"
             }


         }) .then(e => e.json())
            .then(e => {
                 dataGet();
                    });
         
     
 }

function domDialogReset(){
    console.log("domDialogReset");

    document.querySelector("#insert").classList.add("hide");
    document.querySelector("#delete").classList.add("hide");

    document.querySelector("  [data-content=name]").value = "";
    document.querySelector("  [data-content=problem_short]").value = "";
    document.querySelector(" [data-content=problem_long]").value = "";
    //document.querySelector("#insertProblem").addEventListener("click", domDialogShowInsert);
    //document.querySelector("[data-content=deleteList]").removeEventListener("click", domDialogShowInsertRow);
   

}

function domDialogShowInsertRow() {


    console.log('domDialogShowInsertRow');

   // document.querySelector("[data-content=deleteList]").removeEventListener("click", domDialogShowInsertRow);
    let problem_owner = document.querySelector("  [data-content=name]").value;
    let problem_short = document.querySelector("  [data-content=problem_short]").value;
    let problem_long = document.querySelector(" [data-content=problem_long]").value;
    //2 next lines updates my problem
    let body = { "problem_owner": problem_owner, "problem_short": problem_short, "problem_long": problem_long };



    dataInsertRow(body);


}

function dataInsertRow( body){
     console.log("dataInsertRow", );


 
  

     fetch(dbUrl, {


         method: "POST",

         headers: {
             "Content-Type": "application/json; charset=utf-8",
             "x-apikey": apikey,
             "cache-control": "no-cache"
         },
         body: JSON.stringify(body),
         json: true
     }).then(e => e.json())
         .then(e => {
            
           
             dataGet();
          


         });
 }
function dropdownListChosenRow(event, id, problems) {
    console.log("sbListChosen", id);

    document.querySelector("#updateProblem").dataset.id = id;
    let chosen = problems.filter(problem => problem._id === id);

    document.querySelector("  [data-content=name]").value = chosen[0].problem_owner;;
    document.querySelector("  [data-content=problem_short]").value = chosen[0].problem_short;
    document.querySelector("  [data-content=problem_long]").value = chosen[0].problem_long;

    //NB husk hvilken der er valgt, så den bliver slettet fra listen når der trykkes på updater problem


}
function format(date) {
    console.log("date",date);




    const hours = date.getHours();
    const minutes = date.getMinutes();

   // return (1 + ((hours - 1) % 12)) + ":" + minutes.toString().padStart(2, "0") + " " + ((hours > 11) ? "PM" : "AM");
    return (1 + ((hours - 1) % 12)) + ":" + minutes.toString().padStart(2, "0") ;
}




///------------------------------------DOM funktioner-----------------------------------------------

function domDialogShowInsert() {
    console.log('domDialogShowInsert');

    document.querySelector("#popupScreen").classList.remove("hide");
    document.querySelector("#delete").classList.add("hide");
    document.querySelector("#updateProblem").classList.add("hide");

    document.querySelector("#insertProblem").classList.remove("hide");
   

    document.querySelector("#insert").classList.remove("hide");

    document.querySelector("#insertProblem").addEventListener("click", domDialogShowInsertRow);
    document.querySelector("#updateProblem").dataset.id = "";
    domDialogReset();
}


function domDeleteRows(){
    console.log("deleteRow");
  
    //document.querySelector(`.id_${id}`).remove();
    document.querySelectorAll("tbody > tr:nth-child(n+2)").forEach(e => e.remove());
    document.querySelectorAll('#selections option:nth-child(n+2)').forEach(e => e.remove());
    
}
function domShowContent(problems) {
    console.log("showContent");
    // document.querySelector("#popupScreen").classList.add("hide");
    // document.querySelector("#delete").classList.add("hide");


    let template = document.querySelector('#question');
    let template2 = document.querySelector('#solved_by');

    //question list
    let qList = document.querySelector("tbody");
    //solvedby list
    let dropdownList = document.querySelector("#selections");




        // Loop
    problems.forEach((el, i) => {
       // console.log("i er ", i);
        let clone = template.content.cloneNode(true);
        let clone2 = template2.content.cloneNode(true);

        clone.querySelector("[data-content=name]").textContent = el.problem_owner;
        clone.querySelector("[data-content=problem_short]").innerHTML = `<strong>${el.problem_short}</strong><br> ${el.problem_long} `;
        const date = new Date(el._created);
        clone.querySelector("[data-content=timeInQue]").textContent = format(date);
        ;
        clone.querySelector("button").dataset.id = el._id;



//--------------------------------------Klik på delete/update knap -------------------------------------- 

        clone.querySelector("[data-content=deleteList]").addEventListener("click", domDialogShow);
//--------------------------------------Klik på delete/update knap slut -------------------------------------- 




        clone2.querySelector("option").textContent = el.problem_owner + ": " + el.problem_short;
        clone2.querySelector("option").dataset.id = el._id;
        clone2.querySelector("option").value = el._id;

        qList.appendChild(clone);
        dropdownList.appendChild(clone2);




        var dropdownListChosen = (event) => {
            console.log("remove eventlistener fra sbList this", this);
          
            let id = document.querySelector("#selections").value;
            dropdownListChosenRow(event, id, problems);
          
        };


        dropdownList.addEventListener("change", dropdownListChosen);

        function domDialogShow() {
            console.log('deleteFromQueDialog');
            document.querySelector("#popupScreen").classList.remove("hide");

            document.querySelector("#insertProblem").classList.add("hide");
            document.querySelector("#updateProblem").classList.remove("hide");
           // document.querySelector("#insertProblem").removeEventListener("click", domDialogShow);
           // document.querySelector("#insertProblem").removeEventListener("click", domDialogShowInsert);

            //domDialogReset();

           
                document.querySelector("#delete").classList.remove("hide");
            
            
            //document.querySelector("#updateProblem").addEventListener("click", updateProblem);
           
            // Assign the listener callback to a variable, and remove ventlistener. 
            var deleteRow = (event) => {
                console.log("remove eventlistener fra #removeProblem");
                dataDeleteRow(event, this.dataset.id);
                document.querySelector("#removeProblem").removeEventListener('click', deleteRow);
            };
            document.querySelector("#removeProblem").addEventListener('click', deleteRow);

            var updateRow = (event) => {
                console.log("remove eventlistener fra #removeProblem");
                let deleteId = document.querySelector("#updateProblem").dataset.id;
                console.log("this.dataset.id", this.dataset.id)

                let id = el._id;
                console.log("this.value: ", el._id);
                let problem_owner = document.querySelector("  [data-content=name]").value;
                let problem_short = document.querySelector("  [data-content=problem_short]").value;
                let problem_long = document.querySelector(" [data-content=problem_long]").value ;
                //2 next lines updates my problem
                let body = { "problem_owner": problem_owner, "problem_short": problem_short, "problem_long": problem_long };
             
               
                    dataUpdateRow(event, body, id, deleteId);
              
                document.querySelector("#updateProblem").removeEventListener('click', updateRow);
            };
            document.querySelector("#updateProblem").addEventListener('click', updateRow);



      
        }
    });

}

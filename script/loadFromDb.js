window.addEventListener("load", start);

let deletedIds = [];
let addedProblems = [{}];


function start() {
    //console.log('start');

    

 
        var qrcode = new QRCode(document.getElementById("qrcode"), {
            text: window.location.href,
        width: 128,
        height: 128,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });


    dataGet();
    document.querySelector("#closeDialog").addEventListener("click", closeDialog);
    document.querySelector("#insertDialogShow").addEventListener("click", insertDialogShow);
}

function dataGet(justAddedId){
    //console.log("dataGet");

    //remove just added problem

    posJustAddedId = addedProblems.map(function (element) { return element._id; }).indexOf(justAddedId);
    addedProblems.splice(posJustAddedId, 1);
   
    



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

           // console.table(problems);
        
            domDeleteRows();

           


            //add added not in problems yet
            let localProblems = problems.concat(JSON.parse(JSON.stringify(addedProblems)));
          
            //filter out deleted probelms
            var problemsWithoutDeleteditems = localProblems.filter(function (item) {
                return deletedIds.indexOf(item._id) == -1;
            });
           
            domShowContent(problemsWithoutDeleteditems);
         
        });
}
function dataInsert(body) {
    console.log("dataInsert", body);

    //update local problems
    closeDialog();



    const bodyTemp = JSON.parse(JSON.stringify(body));
    console.log("problems bodyTemp: ", bodyTemp);
    bodyTemp._created = "opdaterer";
    console.log("problems bodyTemp med created: ", bodyTemp);
    console.log("addedprobelms",addedProblems);


    addedProblems.push(bodyTemp);
    let localProblems = problems.concat(JSON.parse(JSON.stringify(addedProblems)));

    var problemsWithoutDeleteditems = localProblems.filter(function (item) {
        return deletedIds.indexOf(item._id) == -1;
    });

    domDeleteRows();
    domShowContent(problemsWithoutDeleteditems);

    








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
            let addedProblem =e;

            dataGet(addedProblem._id);



        });
}
function dataUpdateRow(event, body,  updateId, deleteId ){
    //console.log("dataUpdate: ", event,  body, updateId, deleteId);

    closeDialog();

    //if i update my own
    if (updateId != deleteId) {
        dataDeleteRow(event, deleteId);
        deletedIds.push(deleteId);
    } 
    //delete from the dom first
    domDeleteRows();


    let problemsWithoutDeleteditems ={};
  
     problemsWithoutDeleteditems = problems.filter(function (item) {
        return deletedIds.indexOf(item._id) == -1;
    });

    console.log("problemsWithoutDeleteditems" );
    console.table(problemsWithoutDeleteditems);

    //let updateIndex = problemsWithoutDeleteditems.indexOf(updateId);
    let updateIndex = problems.map(function (e) { return e._id; }).indexOf(updateId);

    console.log("updateIndex: ", updateIndex);

    problemsWithoutDeleteditems[updateIndex].problem_owner = body.problem_owner;
    problemsWithoutDeleteditems[updateIndex].problem_short = body.problem_short;
    problemsWithoutDeleteditems[updateIndex].problem_long = body.problem_long;
    

    //console.log("problemsWithoutDeleteditems in datadelete", problemsWithoutDeleteditems);

    domShowContent(problemsWithoutDeleteditems);


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
           
                dataGet();
            
        });
}
function dataDeleteRow(event, id) {
    console.log("eventhandler", event, id);
    closeDialog();

    deletedIds.push(id);
    //console.log("deletedIds.push(id) in data delete", deletedIds);
    //delete from local problems first
    domDeleteRows();

    var problemsWithoutDeleteditems = problems.filter(function (item) {
        return deletedIds.indexOf(item._id) == -1 ;
    });

    //console.log("problemsWithoutDeleteditems in datadelete", problemsWithoutDeleteditems);

    domShowContent(problemsWithoutDeleteditems);
    //delete from local problems SLUT

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

function dropdownListChosenRow(event, id, problems) {
    //console.log("sbListChosen", id);

    document.querySelector("#updateBtn").dataset.id = id;
    let chosen = problems.filter(problem => problem._id === id);

    document.querySelector("  [data-content=name]").value = chosen[0].problem_owner;
    document.querySelector("  [data-content=problem_short]").value = chosen[0].problem_short;
    document.querySelector("  [data-content=problem_long]").value = chosen[0].problem_long;

    //NB husk hvilken der er valgt, så den bliver slettet fra listen når der trykkes på updater problem


}
function format(date) {
   // console.log("date",date);

    




    const hours = date.getHours();
    const minutes = date.getMinutes();

    if (isNaN(hours)) {
        return "OPDATERER";
    }

   // return (1 + ((hours - 1) % 12)) + ":" + minutes.toString().padStart(2, "0") + " " + ((hours > 11) ? "PM" : "AM");
    return (1 + ((hours - 1) % 12)) + ":" + minutes.toString().padStart(2, "0") ;
}




///------------------------------------DOM funktioner-----------------------------------------------



function closeDialog() {
    //console.log("dialogClose");

    document.querySelector("#dialog").classList.add("hide");

   // document.querySelector("#insertBtn").classList.add("hide");
    //document.querySelector("#delete").classList.add("hide");

    document.querySelector("  [data-content=name]").value = "";
    document.querySelector("  [data-content=problem_short]").value = "";
    document.querySelector(" [data-content=problem_long]").value = "";

 


}

function insert() {
    //console.log('insert');

    let problem_owner = document.querySelector("  [data-content=name]").value;
    let problem_short = document.querySelector("  [data-content=problem_short]").value;
    let problem_long = document.querySelector(" [data-content=problem_long]").value;
    //2 next lines updates my problem
    let body = { "problem_owner": problem_owner, "problem_short": problem_short, "problem_long": problem_long };



    dataInsert(body);


}


  


// }

function insertDialogShow() {
    //console.log('insertDialogShow');

    //SHOW
    document.querySelector("#dialog").classList.remove("hide");
    document.querySelector("#insertBtn").classList.remove("hide");
    document.querySelector("#updateProblem").classList.add("hide");
    document.querySelector("#problem").classList.remove("hide");
   

    //HIDE
    document.querySelector("#delete").classList.add("hide");
    document.querySelector("#updateBtn").classList.add("hide");
    
    //CLICK
    document.querySelector("#insertBtn").addEventListener("click", insert);

    //DATA
    document.querySelector("#updateBtn").dataset.id = "";
   
}


function domDeleteRows(){
    //console.log("deleteRow");
  
    //document.querySelector(`.id_${id}`).remove();
    document.querySelectorAll("tbody > tr:nth-child(n+2)").forEach(e => e.remove());
    document.querySelectorAll('#selections option:nth-child(n+2)').forEach(e => e.remove());
    
}
function domShowContent(problems) {
    //console.log("showContent");
    // document.querySelector("#dialog").classList.add("hide");
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
        //console.log("id: ", el._id);
        clone.querySelector("[data-content=deleteList]").dataset.id = el._id;



//--------------------------------------Klik på delete/update knap -------------------------------------- 

        clone.querySelector("[data-content=deleteList]").addEventListener("click", deleteDialogShow);
        clone.querySelector("[data-content=updateList]").addEventListener("click", updateDialogShow);
//--------------------------------------Klik på delete/update knap slut -------------------------------------- 




        clone2.querySelector("option").textContent = el.problem_owner + ": " + el.problem_short;
        clone2.querySelector("option").dataset.id = el._id;
        clone2.querySelector("option").value = el._id;

        qList.appendChild(clone);
        dropdownList.appendChild(clone2);




        var dropdownListChosen = (event) => {
            //console.log("remove eventlistener fra sbList this", this);
          
            let id = document.querySelector("#selections").value;
            dropdownListChosenRow(event, id, problems);
          
        };


        dropdownList.addEventListener("change", dropdownListChosen);

        function deleteDialogShow() {
            console.log('deleteDialogShow');

            console.log("HER KOMMER ID", this.dataset.id);
             
            //SHOW

            document.querySelector("#dialog").classList.remove("hide");
            document.querySelector("#delete").classList.remove("hide");
            

            //HIDE
            document.querySelector("#insertBtn").classList.add("hide");
            document.querySelector("#updateBtn").classList.add("hide");
            document.querySelector("#problem").classList.add("hide");
            document.querySelector("#updateProblem").classList.add("hide");
          
            
            //document.querySelector("#updateBtn").addEventListener("click", updateProblem);
           
            // Assign the listener callback to a variable, and remove ventlistener. 
            var deleteRow = (event) => {
                //console.log("remove eventlistener fra #removeProblem");
                document.querySelector("#removeProblem").removeEventListener('click', deleteRow);
        
                dataDeleteRow(event, this.dataset.id);
                //console.log("HER KOMMER ID", this.dataset.id);
               // document.querySelector("#removeProblem").removeEventListener('click', deleteRow);
            };
            document.querySelector("#removeProblem").addEventListener('click', deleteRow);

           



      
        }

        function updateDialogShow() {
            //console.log('deleteFromQueDialog');

            //HIDE
            document.querySelector("#insertBtn").classList.add("hide");
            document.querySelector("#delete").classList.add("hide");


            //SHOW
            document.querySelector("#dialog").classList.remove("hide");
            document.querySelector("#updateBtn").classList.remove("hide");
            document.querySelector("#problem").classList.remove("hide");
            document.querySelector("#updateProblem").classList.remove("hide");

           


            //dialogClose();


            


            //document.querySelector("#updateBtn").addEventListener("click", updateProblem);

           

            var updateRow = (event) => {
                //console.log("remove eventlistener fra #removeProblem");
                let deleteId = document.querySelector("#updateBtn").dataset.id;
                //console.log("this.dataset.id", this.dataset.id)

                let id = el._id;
                //console.log("this.value: ", el._id);
                let problem_owner = document.querySelector("  [data-content=name]").value;
                let problem_short = document.querySelector("  [data-content=problem_short]").value;
                let problem_long = document.querySelector(" [data-content=problem_long]").value;
                //2 next lines updates my problem
                let body = { "problem_owner": problem_owner, "problem_short": problem_short, "problem_long": problem_long };


                dataUpdateRow(event, body, id, deleteId);

                document.querySelector("#updateBtn").removeEventListener('click', updateRow);
            };
            document.querySelector("#updateBtn").addEventListener('click', updateRow);




        }
    });

}

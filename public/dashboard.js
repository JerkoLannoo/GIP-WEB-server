var eenvoudigVerbruik=[]
var verbruik = []
var sorted=[];
var historyData;
var popup = document.getElementById("pop-up")
var popupBackground=document.getElementById("pop-up-background")
var popupInfo=document.getElementById("pop-up-info")
var popupBtn = document.getElementById("pop-up-btn")
var prices = [];
var dataPrices=[]
getHistory()
getTimePrices()
getDataPrices()
getSaldo() 
getVerbruik()
for(let i=0;i<document.getElementById("main").querySelectorAll("div").length;i++) document.getElementById("main").querySelectorAll("div")[i].style.display="none"
document.getElementById("history").style.display="block"

function showTab(el, btn){
    for(let i=0;i<document.getElementById("main").querySelectorAll("div").length;i++) {
        document.getElementById("main").querySelectorAll("div")[i].style.display="none"
    } 
    for(let i=0;i<document.getElementById("topnav").querySelectorAll("button").length;i++) {
        document.getElementById("topnav").querySelectorAll("button")[i].style.backgroundColor="#1cde18"
    } 
    el.style.display="block"
    btn.style.backgroundColor="#4294ff"
}
function getHistory(){
    console.log("ok")
    document.getElementById("loading-spinner").style.display="block"
    fetch("/user/dashboard/get-history")
    .then(response=>response.json())
    .then(data=>{
        console.log(data)
        let history=data
        historyData=data
        sorted=data
        createSimpleHistory(data)
        sort()
    }).catch(err=>{
        console.log(err)
        document.getElementById("info").innerText="Er ging iets mis."
        document.getElementById("loading-spinner").style.display="none"
    })

}
function createSimpleHistory(data){

        document.getElementById('info').innerText=""
        let history=data
        let len=document.getElementsByClassName("history").length
        for(let i=len-1;i>=0;i--) document.getElementsByClassName("history")[i].remove();
        if(!data.length) document.getElementById("info").innerText="Geen geschiedenis om te zien."
        for(let i=0;i<history.length;i++) {
        let anchor = document.createElement("a") 
        let el = document.createElement("tr")
        el.setAttribute("onclick", "showHistoryInfo(this)")
        el.setAttribute("class", "history")
     /*   let date = document.createElement("td")
        date.setAttribute("class", "date")
        date.innerText=formatDate(history[i].creationDate)//aanmaak datum
        el.appendChild(date)*/
        let adate = document.createElement("td")
        adate.setAttribute("class", "adate")
        adate.innerText=new Date(parseInt(history[i].activeDate)).toLocaleDateString("en-GB")//activatie datum
        el.appendChild(adate)
        let duration = document.createElement("td")
        if(history[i].time!=null) duration.innerText=formatTime(history[i].time)//duratief/data
        else duration.innerText=history[i].data + " GB"
        el.appendChild(duration)
      /*  let price = document.createElement("td")
        price.setAttribute("class", "price")
        price.innerText="€"+history[i].price.toFixed(2)
        el.appendChild(price)
        let devices = document.createElement("td")
        devices.setAttribute("class", "devices")
        devices.innerText=history[i].used+"/"+history[i].devices
        el.appendChild(devices)*/
        let type = document.createElement("td")
        type.setAttribute("class", "type")
        type.innerText=setType(history[i].type)
        el.appendChild(type)
      /*  let infodiv = document.createElement("tr")
        infodiv.setAttribute("class", "history-detals")
        infodiv.style.display="none"
        document.getElementById("history-table-body").appendChild(infodiv)*/
        document.getElementById("history-table-body").appendChild(el)
    }
    document.getElementById("loading-spinner").style.display="none"
}
function createHistory(data){
        let history=data
        document.getElementById("history-data").innerHTML=""
        let el = document.getElementById("history-data")
        let date = document.createElement("p")
        date.setAttribute("class", "date")
        date.innerText="Aanmaak datum: "+formatDate(history.creationDate)//aanmaak datum
        el.appendChild(date)
        let adate = document.createElement("p")
        adate.setAttribute("class", "adate")
        adate.innerText="Activatie datum: "+new Date(parseInt(history.activeDate)).toLocaleDateString("en-GB")//activatie datum
        el.appendChild(adate)
        let duration = document.createElement("p")
        if(history.time!=null) duration.innerText="Duratief: "+formatTime(history.time)
        else duration.innerText="Data: "+history.data + " GB"
        el.appendChild(duration)
        let price = document.createElement("p")
        price.setAttribute("class", "price")
        price.innerText="Prijs: €"+history.price.toFixed(2)
        el.appendChild(price)
        let devices = document.createElement("p")
        devices.setAttribute("class", "devices")
        devices.innerText="Gebruikte/beschikbare apparaten: "+history.used+"/"+history.devices
        el.appendChild(devices)
        let type = document.createElement("p")
        type.setAttribute("class", "type")
        type.innerText="Type: "+setType(history.type)
        el.appendChild(type)
        let ldate = document.createElement("p")
        ldate.setAttribute("class", "devices")
        ldate.innerText="Login datum: "+formatDate(history.loginDate)
        el.appendChild(ldate)
        let password = document.createElement("p")
        if(history.type==1) password.innerText="Wachtwoord: "+history.password
        else password.innerText="Wachtwoord: [Wi-Fi wachtwoord]"
        el.appendChild(password)
        let username = document.createElement("p")
        username.innerText="Gebruikersnaam: "+history.username
        el.appendChild(username)
    document.getElementById("loading-spinner").style.display="none"
}
function calcTotPrice(){
    console.log("calc tot price")
    document.getElementById("total-price").innerText=(parseFloat(document.getElementById("normal-price").innerText)+parseFloat(document.getElementById("g-price").innerText)).toFixed(2)
}
function calcTotDataPrice(){
    console.log("calc tot data price")
    document.getElementById("data-total-price").innerText=(parseFloat(document.getElementById("data-normal-price").innerText)+parseFloat(document.getElementById("data-g-price").innerText)).toFixed(2)
}
function getSaldo(){
    fetch("/user/dashboard/get-saldo")
    .then(response=>response.json())
    .then(data=>{
        document.getElementById("saldo-total").innerText="€"+data[0].saldo
    })
    .catch(err=>{
        console.log(err)
        document.getElementById("saldo-info").innerText="Kan saldo niet ophalen. Probeer later opnieuw."
    })
}
function getTimePrices(){
    fetch("/user/dashboard/get-time-prices")
    .then(response=>response.json())
    .then(data=>{
        console.log(data);
        data.forEach(element => {
            prices.push(element);//kan weg
        });
        console.log(prices);
    })
    .catch(err=>{
        console.log(err)
    })

}
function getDataPrices(){
    fetch("/user/dashboard/get-data-prices")
    .then(response=>response.json())
    .then(data=>{
        console.log(data);
        data.forEach(element => {
            dataPrices.push(element);//kan weg
        });
        console.log(dataPrices);
    })
    .catch(err=>{
        console.log(err)
    })

}
function calcPrice(input, priceField, type){
    if(document.getElementById("time-new").style.display!=="none"){//tijd optie
        console.log(priceField)
    if(type==="n"){//normaal
        if(input.value>0){
            for(let i=prices.length-1;i>=0;i--){
                if(prices[i].devices<=input.value&&prices[i].time<=document.getElementById("duration").value*document.getElementById("normal-duration-select").value) {
                    console.log(prices)
                    priceField.innerText=(prices[i].price*input.value*document.getElementById("duration").value*document.getElementById("normal-duration-select").value).toFixed(2);
                    console.log("price: "+prices[i].price.toFixed(2))
                    break
                }
            }
        }
        else priceField.innerText= "0"
    }
    else{//gast
        if(input.value>0) {
            for(let i=prices.length-1;i>=0;i--){
                if(prices[i].devices<=input.value&&prices[i].time<=document.getElementById("g-duration").value*document.getElementById("g-duration-select").value) {
                    console.log(prices)
                    priceField.innerText=(prices[i].price*input.value*document.getElementById("g-duration").value*document.getElementById("g-duration-select").value).toFixed(2);
                    console.log("price: "+prices[i].price.toFixed(2))
                    break
                }
            }
        }
        else priceField.innerText= "0"
        
    }
        calcTotPrice()
    }
    else{//data optie
        console.log("calc data")
    if(type==="n"){//normaal
        let data=document.getElementById("normal-data-select").value
        for(let i=dataPrices.length-1;i>=0;i--){
            if(dataPrices[i].data==data) priceField.innerText=dataPrices[i].price*input.value
            console.log(dataPrices[i].data + " "+data+" "+input.value)
        }
    }
    else{//gast
        let data=document.getElementById("g-data-select").value
        for(let i=dataPrices.length-1;i>=0;i--){
            if(dataPrices[i].data==data) priceField.innerText=dataPrices[i].price*input.value
            console.log(dataPrices[i].data + " "+data+" "+input.value)
        }
        
    }
        calcTotDataPrice()
    }
}
function switchNew(el){
    if(el.innerText==="Tijd"){
        document.getElementById("time-new").style.display="block"
        el.parentElement.querySelectorAll("a")[1].style.backgroundColor="#1cde18"
        document.getElementById("data-new").style.display="none"
        el.style.backgroundColor = "#4294ff"
    }
    else{
        document.getElementById("time-new").style.display="none"
        el.parentElement.querySelectorAll("a")[0].style.backgroundColor="#1cde18"
        document.getElementById("data-new").style.display="block"
        el.style.backgroundColor = "#4294ff"
    }
}
function setCreationType(){
    if(document.getElementById("time-new").style.display!=="none") createNewTime()
    else createNewData()
}
function createNewData(){
    document.getElementById("pop-up-spinner").style.display="block"
    popup.style.display="block"
    popupBackground.style.display="block"
    popupInfo.style.color="red"
    popupInfo.innerText="Wacht even..."
    popupBtn.innerText="Sluiten"
    let adblock=false;
    if(document.getElementById("adblockj").checked) adblock=true;
    let data= "adblock="+adblock+"&"+
    'activationDate='+new Date(document.getElementById("data-activation-date").value).getTime()+'&'+
    'data='+document.getElementById("normal-data-select").value+'&'+
    'devices='+document.getElementById("data-devices").value+'&'+
    'gData='+document.getElementById("g-data-select").value+'&'+
    'gDevices='+document.getElementById("data-g-devices").value+'&'
   if(document.getElementById("adblockj").checked) data+='adblocker='+true
   else data+='adblocker='+false
//       console.log(data)
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/user/dashboard/create-new-data", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send(data)
    xhr.onreadystatechange = () => {
    document.getElementById("pop-up-spinner").style.display="none"
     if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        let response=JSON.parse(xhr.response)
        console.log(xhr.response)
        if(response.success){
            popupInfo.style.color="black"
    popupInfo.innerText="Beurt toegevoegd."
    popupBtn.innerText="Sluiten"
        }
        else{
            popupInfo.style.color="red"
    popupInfo.innerText=response.msg
    popupBtn.innerText="Sluiten"
        }
    }
    else{
    popupInfo.style.color="red"
    popupInfo.innerText="Er ging iets mis."
    popupBtn.innerText="Sluiten"
    }
    };
}
function createNewTime(){
        document.getElementById("pop-up-spinner").style.display="block"
        popup.style.display="block"
        popupBackground.style.display="block"
        popupInfo.style.color="red"
        popupInfo.innerText="Wacht even..."
        popupBtn.innerText="Sluiten"
        let adblock=false;
        if(document.getElementById("adblockj").checked) adblock=true;
        let data= "adblock="+adblock+"&"+
        'activationDate='+new Date(document.getElementById("activation-date").value).getTime()+'&'+
        'duration='+document.getElementById("duration").value*document.getElementById("normal-duration-select").value+'&'+
        'devices='+document.getElementById("devices").value+'&'+
        'gDuration='+document.getElementById("g-duration").value*document.getElementById("g-duration-select").value+'&'+
        'gDevices='+document.getElementById("g-devices").value+'&'
       if(document.getElementById("adblockj").checked) data+='adblocker='+true
       else data+='adblocker='+false
//       console.log(data)
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/user/dashboard/create-new-time", true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send(data)
        xhr.onreadystatechange = () => {
        document.getElementById("pop-up-spinner").style.display="none"
         if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            let response=JSON.parse(xhr.response)
            console.log(xhr.response)
            if(response.success){
                popupInfo.style.color="black"
        popupInfo.innerText="Beurt toegevoegd."
        popupBtn.innerText="Sluiten"
            }
            else{
                popupInfo.style.color="red"
        popupInfo.innerText=response.msg
        popupBtn.innerText="Sluiten"
            }
        }
        else{
        popupInfo.style.color="red"
        popupInfo.innerText="Er ging iets mis."
        popupBtn.innerText="Sluiten"
        }
        };
}
function formatDate(date){
    if(date!=null)
    {       
    var date = new Date(parseInt(date));
    return date.toLocaleString("en-GB")
    }
    else return "Nog niet ingelogd"
}
function formatTime(time){
   // console.log("time: "+time)
    if(time<24) return time +"h"
    else if(time>=24&&time<720) {
        console.log("tijd groter dan 24: "+time/24+time%24)
        return (time/24)+" Dag(en)"
    }
    else if(time>=720) {
        console.log("tijd groter dan 24")
        return (time/720)+" Maand(en)"
    }
}
function setType(type){
    console.log("set type:"+type)
    if(type==1) return "Gast"
    else return "Privé"
}
function setSaldo(){
    document.getElementById("pop-up-spinner").style.display="block"
    popup.style.display="block"
        popupBackground.style.display="block"
        popupInfo.style.color="red"
        popupInfo.innerText="Wacht even..."
        popupBtn.innerText="Sluiten"
        let data= 'saldo='+document.getElementById("new-saldo").value
        console.log(data)
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/user/dashboard/set-saldo", true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send(data)
        xhr.onreadystatechange = () => {
        document.getElementById("pop-up-spinner").style.display="none"
         if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        popupInfo.style.color="black"
        popupInfo.innerText="Saldo toegevoegd"
        getSaldo()
        popupBtn.innerText="Sluiten"
        }
        else{
        popupInfo.style.color="red"
        popupInfo.innerText="Er ging iets mis."
        popupBtn.innerText="Sluiten"
        }
        };
}
function sort(){
    let date = document.getElementById("dateFilter").value
    let type = document.getElementById("dateTypeFilter").value
    let temp=[];
    let datum=new Date().getTime()
   // console.log("date: "+datum)
    if(date!=""){
   // console.log("type: "+type)
    console.log(sorted)
    let datum;
    for(let i=0;i<historyData.length;i++){
        console.log(historyData[i])
        console.log(historyData[i][type])
        datum =  new Date(parseInt(historyData[i][type])).toDateString()
        console.log(datum+" date: "+new Date(date).toDateString())
        if(datum==new Date(date).toDateString()) temp.push(historyData[i]);
    }
  //  console.log("temp length: "+temp.length)
    sorted=temp
    }
    else sorted=historyData
    temp=[]
    if(document.getElementById("showOnlyValid").checked){
        for(let i=0;i<sorted.length;i++){
            if(sorted[i].devices>sorted[i].used) {
                if(document.getElementById("sortType").value==="")  temp.push(sorted[i]);
                else if(sorted[i].type==document.getElementById("sortType").value) temp.push(sorted[i])
            }
        }
    }
    else {
        for(let i=0;i<sorted.length;i++){
                if(document.getElementById("sortType").value==="")  temp.push(sorted[i]);
                else if(sorted[i].type==document.getElementById("sortType").value) temp.push(sorted[i])
        }
    }
   // console.log(sorted)
    sorted=temp
   // console.log(temp)
    createSimpleHistory(sorted)
}
function showHistoryInfo(el){
    console.log('rowindex: '+el.rowIndex-1)
    console.log(sorted[el.rowIndex-1])
    document.getElementById("info-pop-up").style.display="block"
    document.getElementById("pop-up-background").style.display="block"
    createHistory(sorted[el.rowIndex-1])
}
function showHistroyKeuzemenu(el){
    console.log(el.querySelectorAll("p"))
    if(el.style.display==="block"){
       el.style.display="none"
    }
    else {
        el.style.display="block"
    } 
}
function switchToSubTab(visible, invisible){
    document.getElementById(visible).style.display="block"
    document.getElementById(invisible).style.display="none"
}
function getVerbruik(){
    console.log("ok")
    document.getElementById("loading-spinner").style.display="block"
    fetch("/user/dashboard/get-data-usage")
    .then(response=>response.json())
    .then(data=>{
        console.log(data)
        createVerbruikTable(data)
    })
}
function createVerbruikTable(data){
    let temp=[]
    for(let i =0;i<data[1].length;i++){
        for(let y=0;y<data[0].length;y++){
            if(data[1][i].mac === data[0][y].mac) verbruik.push({computernaam: data[1][i].computername, mac: data[1][i].mac, upload: data[0][y].in_bytes, download: data[0][y].out_bytes, totaal: data[0][y].total_bytes})
        }
    }
    let mac = []
    console.log(verbruik)
    for(let i=0;i<verbruik.length;i++){//verbruik vereenvoudigen: duplicate mac adressen verwijderen 
        let upload=0;
        let download=0;
        let total=0;
        if(!mac.includes(verbruik[i].mac)){
            for(let y=0;y<verbruik.length;y++){
            console.log("loop: "+y+" and i: "+i+"; mac1: "+verbruik[y].mac+" mac2: "+verbruik[y].mac)
            if(verbruik[y].mac===verbruik[i].mac){
                total+=verbruik[y].totaal
                upload+=verbruik[y].upload
                download+=verbruik[y].download
            }
        }
        eenvoudigVerbruik.push({computernaam: verbruik[i].computernaam, mac: verbruik[i].mac, upload: upload, download: download, totaal: total})
        mac.push(verbruik[i].mac)
        }
    }
    console.log(eenvoudigVerbruik)
    let table = document.getElementById("data-usage-table-body")
    for(let i=0;i<eenvoudigVerbruik.length;i++){
        let rij = document.createElement("tr")
        rij.setAttribute("class", "data-usage")
        let deviceName = document.createElement("td")
        deviceName.innerText = eenvoudigVerbruik[i].computernaam
        rij.appendChild(deviceName)
        let mac = document.createElement("td")
        mac.innerText = eenvoudigVerbruik[i].mac
        rij.appendChild(mac)
        let upload = document.createElement("td")
        upload.setAttribute("class","data-usage-mobileHide")
        upload.innerText = formatDataUsage(eenvoudigVerbruik[i].upload)
        rij.appendChild(upload)
        let download = document.createElement("td")
        download.setAttribute("class","data-usage-mobileHide")
        download.innerText = formatDataUsage(eenvoudigVerbruik[i].download)
        rij.appendChild(download)
        let totaal = document.createElement("td")
        totaal.innerText = formatDataUsage(eenvoudigVerbruik[i].totaal)
        rij.appendChild(totaal)
        table.appendChild(rij)
    }
}
function formatDataUsage(data){
    let newdata=0
    if(data>=1000000000) newdata=(data/1000000000).toFixed(1)+" GB"
    else if(data>=1000000) newdata=(data/1000000).toFixed(1)+" MB"
    else if(data>=1000) newdata=(data/1000).toFixed(1)+" kB"
    else newdata=data+" B"
    return newdata
}
const path = require('path')
const csvjson = require('csvjson');
const request = require('request');
const cheerio = require('cheerio');
const stringify = require('csv-stringify');
const fs = require('fs');
var writerStream = fs.createWriteStream('stream.csv')

//const pages = [1,6]
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth()+1; //January is 0!
var yyyy = today.getFullYear();

var newdd

if(dd == 1){
  var testdd
  if(today.getMonth() == 0){
    testdd = new Date(today.getFullYear()-1, 12, 0).getDate();
  }
  else {
    testdd = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  newdd = testdd-1
  mm = today.getMonth()
}

else if (dd == 2 ) {
  var testdd
  if(today.getMonth() == 0){
    testdd = new Date(today.getFullYear()-1, 12, 0).getDate();
  }
  else {
    testdd = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  newdd = testdd
  mm = today.getMonth()
}

else {
  newdd = dd-2
}



if(newdd<10) {
    newdd = '0'+newdd
}

if(mm<10) {
    mm = '0'+mm
}

today = newdd + '/' + mm + '/' + yyyy;

console.log(today);

const pages = [1,2,3,7,8,9,10,12,13,14]
var page = 0;
var previosTable = []

getTable(page,previosTable)

function getTable(page,previosTable){
  var arr=[]
  var currentTable=[]
  var mixtable=[]
  var url = "http://www.world-jc.com:81/pro2018/view_cbm_2018.php?cb="+pages[page]+"&ds="+today+"&de="+today
  //var url = "http://www.world-jc.com:81/pro2018/view_cbm_2018.php?cb="+pages[page]+"&ds=06/12/2018&de=11/12/2018"
  request(url, (err,res,body)=>{
    let $ = cheerio.load(body);
    var x = $('tbody tr td')
    var j=0;
    console.log('page: '+pages[page]+' length: '+x.length);
    if(previosTable.length === 0){
      for(var i=0;i<(x.length-4);i++){
        if(j < 6){
          var str = x[i].children[0].data+""
          arr.push(str.toString().toUpperCase());
          j++;
        }
        if(j == 5){
          currentTable.push(arr)
        }
        if(j == 6){
          //writerStream.write(arr+"\r\n","utf8")
          console.log(arr);
          j=0;
          arr = []
        }
      }
      page++;
      if(page === pages.length){
        console.log('finish');
      }
      else {
        getTable(page,currentTable)
      }
    }
    else {
      for(var i=0;i<(x.length-4);i++){
        if(j < 6){
          //console.log("Row "+x[i].children[0].data);
          var str = x[i].children[0].data+""
          arr.push(str.toString().toUpperCase());
          j++;
        }
        if(j == 5){
          currentTable.push(arr)
        }
        if(j == 6){
          //writerStream.write(arr+"\r\n","utf8")
          console.log(arr);
          j=0;
          arr = []
        }
      }

      var mixtable= previosTable

      for(let i=0; i< previosTable.length; i++){
        if(currentTable.length != 0){

          currentTable.forEach((dataCurr,idC)=>{
            var arrPre = []
            var str = dataCurr[1]+''


            if((previosTable[i][1].toString().trim().toUpperCase())  === (dataCurr[1].toString().trim().toUpperCase())){
              var sum = parseFloat(previosTable[i][4])+parseFloat(dataCurr[4])
              for(let k=0 ; k< previosTable[i].length; k++){
                if(k == 4){
                  arrPre[k] = sum.toString().toUpperCase();
                }
                else {
                  arrPre[k] = previosTable[i][k].toString().toUpperCase()
                }
              }
              mixtable[i] = arrPre
              currentTable = currentTable.filter((val)=>{
                return (val[1].toString().trim().toUpperCase()) != (dataCurr[1].toString().trim().toUpperCase());
              })
            }


          })
        }
        else {
          break;
        }
      }

      currentTable.forEach((dataCurr,idC)=>{
        var arrPre = []
        dataCurr.forEach(dat=>{
          arrPre.push(dat.toString().toUpperCase())
        })
        mixtable.push(arrPre)
      })
      //console.log("curr after"+currentTable.length);
      page++;
      if(page === pages.length){
        //console.log('finish');
        stringify(mixtable, function(err, output) {
          fs.writeFile('mixtable.csv', output, 'utf8', function(err) {
            if (err) {
              console.log('Some error occured - file either not saved or corrupted file saved.');
            } else {
              console.log('mixtable saved');
            }
          });
        });
        compareTable(mixtable)

      }
      else {
        console.log("mix "+mixtable.length);
        getTable(page,mixtable)
      }

    }

  })
}



function compareTable(currentTable) {
  var dataPre = fs.readFileSync(path.join(__dirname, 'previousTable.csv'), { encoding : 'utf8'});
  var options = {
    delimiter : ',', // optional
    quote     : '"' // optional
  };
  var previosTable = csvjson.toArray(dataPre, options);

  var newArr= []
  previosTable.forEach((dat)=>{
    newArr.push(dat[0])
  })
  var userCompared = []
  currentTable.forEach(data =>{
    var newUser=[]
    if(newArr.includes(data[1])){
      var arrPre = []
      for(let i=0;i <= data.length;i++){
        if(i === 5){
          arrPre[i] = 'add'
        }
        else {
          var str = data[i]+''
          arrPre[i] = str.toString().toUpperCase()
        }
      }

      userCompared.push(arrPre)

    }
    else {

      var arrPre = []
      for(let i=0;i <= data.length;i++){
        if(i === 5){
          arrPre[i] = 'New'
        }
        else {
          var str = data[i]+''
          arrPre[i] = str.toString().toUpperCase()
        }
      }
      newUser.push(data[1])
      userCompared.push(arrPre)
      previosTable.push(newUser)
    }

  })

  stringify(previosTable, function(err, output) {
    fs.writeFile('previousTable.csv', output, 'utf8', function(err) {
      if (err) {
        console.log('Some error occured - file either not saved or corrupted file saved.');
      } else {
        console.log('previosTable saved!');
      }
    });
  })

  stringify(userCompared, function(err, output) {
    fs.writeFile('userCompared.csv', output, 'utf8', function(err) {
      if (err) {
        console.log('Some error occured - file either not saved or corrupted file saved.');
      } else {
        console.log('userCompared saved!');
      }
    });
  })

}

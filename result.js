const API_BASE_URL = 'https://marafiqistershad.com/api';

function displayResult() {
    const submissionType = localStorage.getItem('submissionType');
    
    if (submissionType === 'update') {
        const changedFields = JSON.parse(localStorage.getItem('changedFields') || '[]');
        alert(`Form Updated Successfully!\nUpdated fields: ${changedFields.join(', ')}`);
    } else if (submissionType === 'new') {
        alert('New Form Submitted Successfully!');
    }
    
    localStorage.removeItem('submissionType');
    localStorage.removeItem('changedFields');
    
    const submissionId = localStorage.getItem('submissionId');
    
    if (submissionId) {
        // Fetch full details from backend if submission ID exists
        fetch(`${API_BASE_URL}/form/submission/${submissionId}`, {
            credentials: 'include',  // Add this
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(details => {
                console.log(details);
                console.log(details.ApplicationNum)
                // Populate result page with backend data
                populateResultPage(details);
            })
            .catch(error => {
                console.error('Error fetching submission:', error);
                // Fallback to local storage data
                const localDetails = JSON.parse(localStorage.getItem("formDetails"));
                if (localDetails) {
                    populateResultPage(localDetails);
                } else {
                    alert("No submission details found.");
                }
            });
    } else {
        // Fallback to local storage method
        const details = JSON.parse(localStorage.getItem("formDetails"));
        console.log(details);
        if (details) { 
            populateResultPage(details);
        } else {
            alert("No details found.");
        }
    }
}
function populateResultPage(details) {    

    const rupeeFields = ['OwnContribution', 'FamilyFriendsQardan', 'QardanHasana', 'Enayat'];
   
   rupeeFields.forEach(field => {
       const value = details[field];
       document.getElementById(field).textContent = value ? `₹ ${formatIndianNumber(value)}/-` : '-';
   });

   document.getElementById("ITS_ID").textContent = details.its_id;
   document.getElementById("Fullname").textContent = details.arabicFullname;
   document.getElementById("Age").textContent = details.age;
   document.getElementById("Jamaat").textContent = `${details.jamaat} / ${details.jamiaat}`;
   document.getElementById("Remarks").textContent = details.remarks;
   document.getElementById("MontlyIncome").textContent = details.MontlyIncome ? `₹ ${formatIndianNumber(details.MontlyIncome)}/-` : '-';
   document.getElementById("FamilyCount").textContent = details.FamilyCount;
   document.getElementById("Takhmeen").textContent = details.Enayat ? `₹ ${formatIndianNumber(details.Enayat)}/-` : '-';
   document.getElementById("CurrentPropertyType").textContent = details.CurrentPropertyType;
   document.getElementById("HijriDate").textContent = details.HijriDate;
   document.getElementById("VazaratTrackingCode").textContent = details.VazaratTrackingCode;
   document.getElementById("ApplicationNum").textContent = "FEA App No: " + details.ApplicationNum;
   document.getElementById("dynamicDropdown").textContent = details.dynamicDropdown;
   
   
   // Transform Umoor data based on its value
   let transformedUmoor = details.Umoor;
   if (details.Umoor) {
       switch(details.Umoor.toLowerCase()) {
           case 'purchase of new house':
               transformedUmoor = ' 	مكان خريدوا ';
               break;
           case 'new construction':
               transformedUmoor = ' 	مكان نا تعمير ';
               break;
           case 'repair of existing house':
               transformedUmoor = '		مكان نا ترميم ';
               break;
           case 'rental':
               transformedUmoor = '		مكان نا كرايا ';
               break;
           case 'heavy deposit':
               transformedUmoor = '	مكان نا deposit';
               break;
           case 'extension of existing house':
               transformedUmoor = '		مكان نا توسيع ';
               break;
           // Add more cases as needed
           default:
               // Keep original value if no match is found
               break;
       }
   }
   document.getElementById("Umoor").textContent = transformedUmoor || '-';

    const imageElement = document.getElementById('imageUpload');
    console.log('Image element found:', !!imageElement);

    if (imageElement && details.imageData) {
        console.log('Setting image source...');
        imageElement.src = details.imageData;
        imageElement.style.display = 'block';
        imageElement.style.maxWidth = '100%';
        imageElement.style.height = 'auto';
        imageElement.onerror = function () {
            console.error('Error loading image');
        };
        imageElement.onload = function () {
            console.log('Image loaded successfully');
            calculateSum();
        };
    } else {
        console.log('No image data found or image element missing');
        calculateSum();
        if (imageElement) {
            imageElement.style.display = 'none';
            
        }
    }

    const selectedIssues = details.selectedIssues.map(issue => issue.trim());

    const problemCells1 = document.querySelectorAll('#problem1 .cell');
    console.log(details.selectedIssues);
    problemCells1.forEach(cell => {
        const cellText = (cell.textContent || "").replace(/\u00A0/g, " ").trim();
        if (selectedIssues.includes(cellText)) {
            cell.style.background = 'lightgreen';
            cell.style.display = 'block';
        } else {
            cell.style.display = 'none';
        }
});
}



function calculateSum() {
    const cellIds = ["OwnContribution", "FamilyFriendsQardan", "QardanHasana", "Enayat"];
    let sum = 0;

    cellIds.forEach(id => {
        const cell = document.getElementById(id);
        if (cell) {
            // Remove ₹, /-, commas, and whitespace, then parse as a float
            const value = parseFloat(cell.textContent.replace(/₹|\/-|,/g, "").trim()) || 0;
            sum += value;
        }
    });

    // Select the specific cell where the result needs to be displayed
    const lastCell = document.querySelector(".bottom-row:last-child .bottom-cell:first-child");
    if (lastCell) {
        // Format the sum in the Indian numbering format and update the cell content
        lastCell.textContent = "₹ " + formatIndianNumber(sum) + "/-";
    }
}

// Custom function to format numbers in the Indian numbering system
function formatIndianNumber(number) {
    const parts = number.toString().split(".");
    let integerPart = parts[0];
    const decimalPart = parts[1] ? `.${parts[1]}` : "";

    // Apply Indian number formatting
    const lastThree = integerPart.slice(-3);
    const rest = integerPart.slice(0, -3);
    const formattedNumber = rest
        ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
        : lastThree;

    return formattedNumber + decimalPart;
}



function printResult() {
    window.print();
}


document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        printResult();
    }
});

function getCurrentDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
}

// Set the current date when the page loads
document.getElementById('currentDate').textContent = getCurrentDate();

// Run displayResult on page load
window.onload = displayResult;

document.addEventListener('DOMContentLoaded', displayResult);
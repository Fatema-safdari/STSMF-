//const API_BASE_URL = 'https://my-node-app-ac8x.onrender.com/api';


async function fetchDetails() {
    const applicationNum = document.getElementById('ApplicationNum').value.trim();

    if (!applicationNum) {
        alert('Please enter an Application Number');
        return;
    }
 
    // Clear localStorage
    localStorage.removeItem('uploadedImage');
    
    // Reset all form fields
    document.getElementById('mainForm').reset();
    
    // Clear image preview
    const previewImg = document.getElementById('imagePreview');
    if (previewImg) {
        previewImg.src = '';
        previewImg.style.display = 'none';
    }
    
    // Clear all checkboxes
    document.querySelectorAll('input[name="issues"]:checked').forEach(checkbox => {
        checkbox.checked = false;
    });

    try {
        // Check the local database first
        const response = await fetch(`${API_BASE_URL}/form/search?applicationNum=${applicationNum}`, {
            credentials: 'include',  // Add this
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const entry = await response.json();
            console.log(entry);
            populateForm(entry);
        } else if (response.status === 404) {
            // If not found in the local database, fetch from SOAP API
            const soapResponse = await fetchFromSOAP(applicationNum);
            console.log('SOAP Response: ', soapResponse);

            if (soapResponse) {
                populateFormApi1(soapResponse);

                // Call additional APIs sequentially
                try {
                    // First additional API (HandlerE1)
                    const handlerE1Response = await fetchHandlerE1(soapResponse.its_id);
                    if (handlerE1Response) {
                        console.log('HandlerE1 Response:', handlerE1Response);
                        populatePhoto(handlerE1Response);
                    }

                    // Second additional API (HandlerB2)
                    const handlerB2Response = await fetchHandlerB2(soapResponse.its_id);
                    console.log('Outside HandlerB2 Response:', handlerB2Response);
                    console.log('fullname: ', handlerB2Response.Arabic_Fullname)
                    if (handlerB2Response) {
                        console.log('Inside HandlerB2 Response:', handlerB2Response);
                        console.log('fullname: ', handlerB2Response.Arabic_Fullname)
                        populateFormAdditional(handlerB2Response);
                    }
                } catch (error) {
                    console.error('Error fetching additional API details:', error);
                    alert('Some additional data could not be fetched.');
                }
            } else {
                alert('No data found for this Application Number.');
            }
        } else {
            throw new Error('Network response was not ok');
        }
    } catch (error) {
        console.error('Error fetching details:', error);
        alert('Error fetching details. Please try again.');
    }
}

/* Function to fetch data from the SOAP API
async function fetchFromSOAP(applicationNum) {
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
            <soap:Body>
                <GetFEAIstirshadData xmlns="http://fayzeanwar.net/">
                    <JKey>FEA$%5929$%</JKey>
                    <mAPPno>${applicationNum}</mAPPno>
                </GetFEAIstirshadData>
            </soap:Body>
        </soap:Envelope>`;

    try {
        const response = await fetch('https://fayzeanwar.net/feawebservice.asmx', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://fayzeanwar.net/GetFEAIstirshadData'
            },
            body: soapRequest
        });

        if (response.ok) {
            const responseText = await response.text();
            return parseSOAPResponse(responseText);
        } else {
            console.error('SOAP request failed with status:', response.status);
            return null;
        }
    } catch (error) {
        console.error('Error making SOAP request:', error);
        return null;
    }
}*/

// Function to fetch data via your backend proxy
async function fetchFromSOAP(applicationNum) {
    try {
        const response = await fetch('/proxy-soap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ applicationNum })
        });

        if (response.ok) {
            const responseText = await response.text(); // XML response
            return parseSOAPResponse(responseText); // Optional: parse it further
        } else {
            console.error('Proxy request failed with status:', response.status);
            return null;
        }
    } catch (error) {
        console.error('Error making proxy request:', error);
        return null;
    }
}

// Parse the SOAP response from fetchFromSOAP
function parseSOAPResponse(responseText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(responseText, 'text/xml');
    const tableElement = xmlDoc.getElementsByTagName('Table')[0];

    if (!tableElement) {
        return null;
    }

    return {
        AppNo: tableElement.querySelector('Appno')?.textContent || '',
        its_id: tableElement.querySelector('ITS')?.textContent || '',
        OwnContribution: tableElement.querySelector('OwnContribution')?.textContent || '',
        FamilyFriendsQardan: tableElement.querySelector('OthersContribution')?.textContent || '',
        QardanHasana: tableElement.querySelector('QarzanAmt')?.textContent || '',
        Enayat: tableElement.querySelector('EnayatAmt')?.textContent || '',
        CurrentPropertyType: tableElement.querySelector('TypeofProperty')?.textContent || '',
        FamilyCount: tableElement.querySelector('FMCount')?.textContent || '',
        Umoor: tableElement.querySelector('Category')?.textContent || ''
    };
}

// Function to populate the form with SOAP response data
function populateForm(entry) {
    document.getElementById('ITS').value = entry.its_id || '';
    document.getElementById('arabicFullname').value = entry.arabicFullname || '';
    document.getElementById('age').value = entry.age || '';
    document.getElementById('jamiaat').value = entry.jamiaat || '';
    document.getElementById('jamaat').value = entry.jamaat || '';
    document.getElementById('remarks').value = entry.remarks || '';
    document.getElementById('MontlyIncome').value = entry.MontlyIncome || '';
    document.getElementById('FamilyCount').value = entry.FamilyCount || '';
    document.getElementById('OwnContribution').value = entry.OwnContribution || '';
    document.getElementById('FamilyFriendsQardan').value = entry.FamilyFriendsQardan || '';
    document.getElementById('QardanHasana').value = entry.QardanHasana || '';
    document.getElementById('Enayat').value = entry.Enayat || '';
    document.getElementById('CurrentPropertyType').value = entry.CurrentPropertyType || '';
    document.getElementById('Umoor').value = entry.Umoor || '';
    document.getElementById('HijriDate').value = entry.HijriDate || '';
    document.getElementById('VazaratTrackingCode').value = entry.VazaratTrackingCode || '';
    document.getElementById('ApplicationNumber').value = entry.ApplicationNum || '';

    if (entry.imageData) {
        const previewImg = document.getElementById('imagePreview');
        if (previewImg) {
            previewImg.src = entry.imageData;
            previewImg.style.display = 'block';
            localStorage.setItem('uploadedImage', entry.imageData);
        }
    }

    if (entry.selectedIssues) {
        entry.selectedIssues.forEach(issue => {
            const checkbox = document.querySelector(`input[name="issues"][value="${issue}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }

}

// Function to populate the form with SOAP API data (API 1)
function populateFormApi1(entry) {
    document.getElementById('ITS').value = entry.its_id || '';
    document.getElementById('OwnContribution').value = entry.OwnContribution || '';
    document.getElementById('FamilyFriendsQardan').value = entry.FamilyFriendsQardan || '';
    document.getElementById('QardanHasana').value = entry.QardanHasana || '';
    document.getElementById('Enayat').value = entry.Enayat || '';
    document.getElementById('CurrentPropertyType').value = entry.CurrentPropertyType || '';
    document.getElementById('Umoor').value = entry.Umoor || '';
    document.getElementById('ApplicationNumber').value = entry.AppNo || '';
    document.getElementById('FamilyCount').value = entry.FamilyCount || '';
}

// // Function to fetch additional API (HandlerE1)
// async function fetchHandlerE1(itsId) {
//     const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
//         <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
//             <soap:Body>
//                 <HandlerE1 xmlns="http://api.its52.com/">
//                     <Auth_Token>NjZvl8TJf3sE5QmcyLAXM6HdpOaw9KhWtFRzBYkIUqg4bn0u7SeDP</Auth_Token>
//                     <HCode>F96GX04HH4</HCode>
//                     <Param1>${itsId}</Param1>
//                 </HandlerE1>
//             </soap:Body>
//         </soap:Envelope>`;

//     const response = await fetch('https://api.its52.com/Services.asmx', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'text/xml; charset=utf-8',
//             'SOAPAction': '"http://api.its52.com/HandlerE1"'
//         },
//         body: soapRequest
//     });

//     if (response.ok) {
//         const responseText = await response.text();
//         return parseHandlerE1Response(responseText);
//     } else {
//         console.error('HandlerE1 request failed with status:', response.status);
//         return null;
//     }
// }

async function fetchHandlerE1(itsId) {
    try {
        const response = await fetch('/proxy-handlerE1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itsId })
        });

        if (response.ok) {
            const responseText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(responseText, "text/xml");
            const result = xmlDoc.getElementsByTagName("HandlerE1Result")[0]?.textContent;
            
            // Return the raw byte code/text content for parsing
            return result;
        } else {
            console.error('HandlerE1 fetch failed:', response.status);
        }
    } catch (error) {
        console.error('HandlerE1 request error:', error);
    }

    return null;
}

// Parse HandlerE1 response and get photo
function parseHandlerE1Response(responseText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(responseText, 'text/xml');
    const photoElement = xmlDoc.getElementsByTagName('GoldenThumbnailPhoto')[0];
    return photoElement ? photoElement.textContent : null;
}

// Function to display the photo
function populatePhoto(photoBase64) {
    const previewImg = document.getElementById('imagePreview');
    console.log("photo",photoBase64);
    if (previewImg) {
        previewImg.src = `data:image/jpeg;base64,${photoBase64}`;
        previewImg.style.display = 'block';
    }

    localStorage.setItem('uploadedImage', `data:image/jpeg;base64,${photoBase64}`);
    
    
}

// // Function to fetch additional API (HandlerB2)
// async function fetchHandlerB2(itsId) {
//     const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
//         <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
//             <soap:Body>
//                 <HandlerB2 xmlns="http://api.its52.com/">
//                     <Auth_Token>NjZvl8TJf3sE5QmcyLAXM6HdpOaw9KhWtFRzBYkIUqg4bn0u7SeDP</Auth_Token>
//                     <HCode>EDCLVWIUBB</HCode>
//                     <Data_Output>JSON</Data_Output>
//                     <Param1>${itsId}</Param1>
//                 </HandlerB2>
//             </soap:Body>
//         </soap:Envelope>`;

//     const response = await fetch('https://api.its52.com/Services.asmx', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'text/xml; charset=utf-8',
//             'SOAPAction': '"http://api.its52.com/HandlerB2"'
//         },
//         body: soapRequest
//     });

//     if (response.ok) {
//         const responseText = await response.text();
//         return parseHandlerB2Response(responseText);
//     } else {
//         console.error('HandlerB2 request failed with status:', response.status);
//         return null;
//     }
// }

async function fetchHandlerB2(itsId) {
    try {
        const response = await fetch('/proxy-handlerB2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itsId })
        });

        if (response.ok) {
            const responseText = await response.text();
            console.log('HandlerB2 SOAP Response:', responseText);
            console.log('HandlerB2 response fullname:', responseText.Arabic_Fullname);

            /*const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(responseText, "text/xml");
            const result = xmlDoc.getElementsByTagName("HandlerB2Result")[0]?.textContent;*/
            return parseHandlerB2Response(responseText);
            
            // Return the result for the parsing function to handle
           // return result;
        } else {
            console.error('HandlerB2 fetch failed:', response.status);
        }
    } catch (error) {
        console.error('HandlerB2 request error:', error);
    }

    return null;
}

// Parse HandlerB2 response and return the data
function parseHandlerB2Response(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        // Return the first item from the Table array
        return data.Table[0]; 
    } catch (error) {
        console.error('Error parsing HandlerB2 response:', error);
        return null;
    }
}

// Function to populate form with additional data (from HandlerB2)
function populateFormAdditional(data) {
    document.getElementById('arabicFullname').value = data.Arabic_Fullname || '';
    document.getElementById('age').value = data.Age || '';
    document.getElementById('jamiaat').value = data.Jamiaat_Arabic_Name || '';
    document.getElementById('jamaat').value = data.Jamaat_Arabic_Name || '';
}





function submitForm(event) {
    event.preventDefault();

    const selectedIssues = Array.from(document.querySelectorAll('input[name="issues"]:checked'))
        .map(cb => cb.value.trim());

    const details = {
        its_id: document.getElementById('ITS').value,
        arabicFullname: document.getElementById('arabicFullname').value,
        age: document.getElementById('age').value,
        jamiaat: document.getElementById('jamiaat').value,
        jamaat: document.getElementById('jamaat').value,
        remarks: document.getElementById('remarks').value,
        MontlyIncome: document.getElementById('MontlyIncome').value,
        FamilyCount: document.getElementById('FamilyCount').value,
        OwnContribution: document.getElementById('OwnContribution').value,
        FamilyFriendsQardan: document.getElementById('FamilyFriendsQardan').value,
        QardanHasana: document.getElementById('QardanHasana').value,
        Enayat: document.getElementById('Enayat').value,
        CurrentPropertyType: document.getElementById('CurrentPropertyType').value,
        Umoor: document.getElementById('Umoor').value,
        HijriDate: document.getElementById('HijriDate').value,
        VazaratTrackingCode: document.getElementById('VazaratTrackingCode').value,
        selectedIssues,
        imageData: localStorage.getItem('uploadedImage'),
        dynamicDropdown: document.getElementById('dynamicDropdown').value,
        ApplicationNum: document.getElementById('ApplicationNum').value.trim(),
    };

    if (!details.ApplicationNum) {
        alert('Application Number is required');
        return;
    }

    // Submit the form data with compressed image
    fetch(`${API_BASE_URL}/form/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(details),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message || 'Submission failed');
            });
        }
        return response.json();
    })
    .then(data => {
        localStorage.setItem("submissionType", data.message.includes('updated') ? 'update' : 'new');
        localStorage.setItem("formDetails", JSON.stringify(details));
        localStorage.setItem("submissionId", data.submissionId);
        window.location.href = "result.html";
    })
    .catch(error => {
        console.error('Submission Error:', error);
        alert('Error submitting form: ' + error.message);
    });
}


function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Check file size (limit to 1MB)
        if (file.size > 1024 * 1024) {
            alert('Image size must be less than 1MB');
            event.target.value = ''; // Clear the file input
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            // Compress image before storing
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate new dimensions (max 800px width/height)
                let width = img.width;
                let height = img.height;
                const maxSize = 800;
                
                if (width > height && width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to compressed JPEG with quality 0.7 (70%)
                const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
                localStorage.setItem('uploadedImage', compressedImage);
                
                // Show preview
                const previewImg = document.getElementById('imagePreview');
                if (previewImg) {
                    previewImg.src = compressedImage;
                    previewImg.style.display = 'block';
                }
            };
            img.src = imageData;
        };
        reader.readAsDataURL(file);
    }
}



async function populateDynamicDropdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/dynamic-dropdown`, {
            credentials: 'include',  // Add this
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            const { values } = await response.json();
            const dropdown = document.getElementById('dynamicDropdown');

            // Clear existing options
            dropdown.innerHTML = '';

            // Populate new options
            values.forEach(value => {
                const option = document.createElement('option');
                option.textContent = value;
                option.value = value;
                dropdown.appendChild(option);
            });

        } else {
            console.error('Failed to fetch dynamic dropdown values');
            alert('Unable to load dropdown options. Please try again later.');
        }
    } catch (error) {
        console.error('Error fetching dropdown values:', error);
        alert('An error occurred while loading dropdown options.');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('mainForm');
    const imageInput = document.getElementById('imageInput');
    
    // Call the function to populate the dynamic dropdown
    populateDynamicDropdown();

    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
    }
    
    if (form) {
        form.addEventListener('submit', submitForm);
    }
    
   
});



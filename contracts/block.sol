pragma solidity ^0.8.12;
pragma experimental ABIEncoderV2;

contract MyContract {
  address public owner;
//   create a customer object
uint public data;
  function date() public view returns (uint) {
    return data;
  }

  function setData(uint _data) external {
    data = _data;
 
  }

    struct Customer {
        string name;
        string phone;
        string[] code;
        bool isValue;
    }
    // create a customer array
    mapping(string => Customer) public CustomerArr;

    //create retailer object
    struct Retailer {
        string name;
        string location;
    }
    //create retailer array
    mapping(string => Retailer) public retailerArr;

    //create QR code object
    struct QRcode {
        uint status;
        string brand;
        string model;
        string description;
        string manufactuerName;
        string manufactuerLocation;
        string manufactuerTimestamp;
        string retailer;
        string[] customers;
    }
    //create QR code array
    mapping(string => QRcode) public qrArr;

    //function to create a customer
    function createCustomer(string memory _hashedEmail , string memory _name, string memory _phone) public payable returns (bool) {
        if (CustomerArr[_hashedEmail].isValue) {
            return false;
        }
        Customer memory new_customer;
        new_customer.name = _name;
        new_customer.phone = _phone;
        new_customer.isValue =true;
        CustomerArr[_hashedEmail] = new_customer;
        return true;

    }
    
    // function to create a retailer
    function createRetailer(string memory _hashedEmail , string memory _name, string memory _location) public payable returns (bool) {
        
        Retailer memory new_retailer;
        new_retailer.name = _name;
        new_retailer.location = _location;
        retailerArr[_hashedEmail] = new_retailer;
        return true;

    }
    function getRetailer(string memory _hashedEmail) public view returns (string memory) {
        return retailerArr[_hashedEmail].name;
    }

    //function to create a QR code
    function createCode(string memory _code, uint  _status , string memory _brand, string memory _model, string memory _description, string memory _manufactuerName, string memory _manufactuerLocation, string memory _manufactuerTimestamp) public payable returns (bool) {
        QRcode memory new_qr;
        new_qr.status = _status;
        new_qr.brand = _brand;
        new_qr.model = _model;
        new_qr.description = _description;
        new_qr.manufactuerName = _manufactuerName;
        new_qr.manufactuerLocation = _manufactuerLocation;
        new_qr.manufactuerTimestamp = _manufactuerTimestamp;
        qrArr[_code] = new_qr;
        return true;
    }

    // function to add retailer to QR code
    function addRetailerToCode(string memory _code, string memory _retailerHashedEmail) public payable returns (bool) {
        
        qrArr[_code].retailer = _retailerHashedEmail;
        return true;
    }

    //function to get QR code details of not a owner
    function getNotOwnedCodeDetails(string memory _code) public view returns ( uint,string memory, string memory, string memory, string memory, string memory, string memory) {
        QRcode memory qr = qrArr[_code];
        return (qr.status, qr.brand, qr.model, qr.description, qr.manufactuerName, qr.manufactuerLocation, qr.manufactuerTimestamp);
    }

    // function to QR code details of owner
    function getOwnedCodeDetails(string memory _code) public view returns ( string memory, string memory) {
        QRcode memory qr = qrArr[_code];
        return (retailerArr[qr.retailer].name, retailerArr[qr.retailer].location);
    }

    //function to get Qr codes of customer 
    function getCodes(string memory _customer) public view returns(string[] memory) {
        return CustomerArr[_customer].code;
    }

    // Function to report stolen
    function reportStolen(string memory _code, string memory _customer) public payable returns (bool) {
        uint i;
        // Checking if the customer exists
        if (CustomerArr[_customer].isValue) {
            // Checking if the customer owns the product
            for (i = 0; i < CustomerArr[_customer].code.length; i++) {
                if (compareStrings(CustomerArr[_customer].code[i], _code)) {
                    qrArr[_code].status = 2;        // Changing the status to stolen
                }
                return true;
            }
        }
        return false;
    }

    function changeOwner(string memory _code, string memory _oldCustomer, string memory _newCustomer) public payable returns (bool) {
        uint i;
        bool flag = false;
         //Creating objects for code,oldCustomer,newCustomer
        QRcode memory product = qrArr[_code];
        uint len_product_customer = product.customers.length;
        Customer memory oldCustomer = CustomerArr[_oldCustomer];
        uint len_oldCustomer_code = CustomerArr[_oldCustomer].code.length;
        Customer memory newCustomer = CustomerArr[_newCustomer];

        //Check if oldCustomer and newCustomer have an account
        if (oldCustomer.isValue && newCustomer.isValue) {
            //Check if oldCustomer is owner
            for (i = 0; i < len_oldCustomer_code; i++) {
                if (compareStrings(oldCustomer.code[i], _code)) {
                    flag = true;
                    break;
                }
            }

            if (flag == true) {
                //Swaping oldCustomer with newCustomer in product
                for (i = 0; i < len_product_customer; i++) {
                    if (compareStrings(product.customers[i], _oldCustomer)) {
                        qrArr[_code].customers[i] = _newCustomer;
                        break;
                    }
                }

                // Removing product from oldCustomer
                for (i = 0; i < len_oldCustomer_code; i++) {
                    if (compareStrings(CustomerArr[_oldCustomer].code[i], _code)) {
                        remove(i, CustomerArr[_oldCustomer].code);
                        // Adding product to newCustomer
                        uint len = CustomerArr[_newCustomer].code.length;
                        if(len == 0){
                            CustomerArr[_newCustomer].code.push(_code);
                            CustomerArr[_newCustomer].code.push("hack");
                        } else {
                            CustomerArr[_newCustomer].code[len-1] = _code;
                            CustomerArr[_newCustomer].code.push("hack");
                        }
                        return true;
                    }
                }
            }
        }
        return false;
    }


    function initialOwner(string memory _code, string memory _retailer, string memory _customer) public payable returns(bool) {
            uint i;
            if (compareStrings(qrArr[_code].retailer, _retailer)) {       // Check if retailer owns the prodct
                if (CustomerArr[_customer].isValue) {                       // Check if Customer has an account
                    qrArr[_code].customers.push(_customer);               // Adding customer in code
                    qrArr[_code].status = 1;
                    uint len = CustomerArr[_customer].code.length;
                    if(len == 0) {
                        CustomerArr[_customer].code.push(_code);
                        CustomerArr[_customer].code.push("hack");
                    } else {
                    CustomerArr[_customer].code[len-1] = _code;
                    CustomerArr[_customer].code.push("hack");
                    }
                    return true;
                }
            }
            return false;
        }


    // Cannot directly compare strings in Solidity
    // This function hashes the 2 strings and then compares the 2 hashes
    function compareStrings(string memory  a, string memory  b) internal returns (bool) {
    	return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    // Function to delete an element from an array
    function remove(uint index, string[] storage array) internal returns(bool) {
        if (index >= array.length)
            return false;

        for (uint i = index; i < array.length-1; i++) {
            array[i] = array[i+1];
        }
        delete array[array.length-1];
        // array.length-=1;
        return true;
    }

    // Function to convert string to bytes32
    function stringToBytes32(string memory source) internal returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        assembly {
            result := mload(add(source, 32))
        }
    }


    



}
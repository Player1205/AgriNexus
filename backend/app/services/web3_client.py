import os
from web3 import Web3
from eth_account import Account
import json

class Web3Client:
    def __init__(self):
        rpc_url = os.environ.get("BASE_SEPOLIA_RPC_URL", "https://sepolia.base.org")
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        
        self.private_key = os.environ.get("DEVELOPER_PRIVATE_KEY")
        if self.private_key and self.private_key != "your_developer_wallet_private_key_here":
            try:
                self.account = Account.from_key(self.private_key)
                self.w3.eth.default_account = self.account.address
            except Exception:
                self.account = None
        else:
            self.account = None
        
        # Basic ABI for the CropPassport create function
        self.contract_abi = [
            {
                "inputs": [
                    {"internalType": "string", "name": "_imageHash", "type": "string"},
                    {"internalType": "string", "name": "_diagnosis", "type": "string"},
                    {"internalType": "string", "name": "_treatmentHash", "type": "string"},
                    {"internalType": "bool", "name": "_isSafe", "type": "bool"}
                ],
                "name": "createPassport",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
        
        self.contract_address = os.environ.get("CROP_PASSPORT_CONTRACT_ADDRESS")
        if self.contract_address:
            self.contract = self.w3.eth.contract(address=self.contract_address, abi=self.contract_abi)
        else:
            self.contract = None

    def sign_gasless_transaction(self, image_hash: str, diagnosis: str, treatment_hash: str, is_safe: bool) -> str:
        """
        Signs and sends a gasless transaction to create a Crop Passport.
        Returns the transaction hash.
        """
        if not self.contract or not self.private_key:
            # Fallback for local development without actual keys
            import hashlib
            dummy_hash = "0x" + hashlib.sha256(f"{image_hash}{diagnosis}".encode()).hexdigest()
            print(f"WEB3 MOCK: Generated dummy transaction hash {dummy_hash}")
            return dummy_hash
            
        try:
            tx = self.contract.functions.createPassport(
                image_hash, diagnosis, treatment_hash, is_safe
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            return self.w3.to_hex(tx_hash)
        except Exception as e:
            print(f"Error signing transaction: {e}")
            return "0xError"

web3_client = Web3Client()

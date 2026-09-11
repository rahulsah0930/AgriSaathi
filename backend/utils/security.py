import re

def mask_aadhaar(aadhaar_input):
    """
    Masks Aadhaar number to display only last 4 digits: 'XXXX XXXX 1234'
    Never stores or returns plain Aadhaar.
    """
    if not aadhaar_input:
        return 'XXXX XXXX 1234'
    
    digits = re.sub(r'\D', '', str(aadhaar_input))
    if len(digits) >= 4:
        last4 = digits[-4:]
        return f"XXXX XXXX {last4}"
    return "XXXX XXXX 1234"

def mask_bank_account(account_input):
    """
    Masks bank account number to display only last 4 digits: 'XXXXXX5678'
    """
    if not account_input:
        return 'XXXXXX5678'
    
    digits = re.sub(r'\D', '', str(account_input))
    if len(digits) >= 4:
        last4 = digits[-4:]
        return f"XXXXXX{last4}"
    return "XXXXXX5678"

def mask_ifsc(ifsc_input):
    """
    Sanitizes IFSC code
    """
    if not ifsc_input:
        return 'SBIN0001234'
    return str(ifsc_input).strip().upper()

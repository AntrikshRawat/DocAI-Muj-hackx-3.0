"""
Test file upload endpoint to diagnose the 500 error
"""
import requests

BASE_URL = 'http://localhost:8080'

print("="*80)
print("FILE UPLOAD TEST")
print("="*80)

# Test JSON file upload
print("\n1. Testing JSON file upload...")
print("-"*80)

try:
    with open('test_medical_data.json', 'rb') as f:
        files = {'file': ('test_medical_data.json', f, 'application/json')}
        response = requests.post(f'{BASE_URL}/session/new/with-file', files=files)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if 'error' in data:
                print(f"\n❌ Error: {data['error']}")
            else:
                print(f"\n✅ Success!")
                print(f"Session ID: {data.get('session_id')}")
                print(f"Pre-filled sections: {data.get('pre_filled_sections')}")
        else:
            print(f"\n❌ Failed with status {response.status_code}")
            
except Exception as e:
    print(f"\n❌ Exception: {type(e).__name__}: {str(e)}")

print("\n" + "="*80)

print("\n💡 If you see errors above, check the server terminal for detailed logs")
print("   The server will show:")
print("   - File received confirmation")
print("   - File size")
print("   - Processing steps")
print("   - Any exceptions with stack traces")
print("\n" + "="*80)

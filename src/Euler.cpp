using namespace std;

int main()
{
	int t;
	int base, N;
    int result, sum, a;
	cin>>t;
	while(t--){
       cout<<"Enter a base number: ";
       cin >> base;
       cout << "Enter an exponent: ";
       cin >> N; 
	
	while (N != 0) {
        result *= base;
        --N;
    }
    cout << result;
    a = result %10;
    a = result/10;
    sum = sum+a;
    cout<<sum;
}
}
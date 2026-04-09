const api = {

    getCurrentUser: () => {
        const userJson = localStorage.getItem('practday_user');
        return userJson ? JSON.parse(userJson) : null;
    },


    setCurrentUser: (userData) => {
        localStorage.setItem('practday_user', JSON.stringify(userData));
    },


    clearUserData: () => {
        localStorage.removeItem('practday_user');
        localStorage.removeItem('practday_token');
    }
};
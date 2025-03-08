import { useNavigate } from 'react-router-dom';

const useCustomNavigate = () => {
    const navigate = useNavigate();
    return (path) => {
        navigate(path);
        window.scrollTo(0, 0); // Scroll to top after navigation
    };
};

export default useCustomNavigate;
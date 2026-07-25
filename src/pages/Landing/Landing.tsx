import { useState, useRef, useEffect } from "react";
import "./scss/Landing.scss";
import { useAuth } from "../../components/hooks/AuthHook";
import { useUser } from "../../components/hooks/UserHook";
import { useNavigate } from "react-router-dom";
import LandingFooter from "./Components/LandingFooter";
import BodyMail from "./Components/BodyMail";
import Loader from "../../components/ts/Loader";
import RegistrationForm from "./Components/RegistrationForm";
import AuthForm from "./Components/AuthForm";

export default function Landing() {
    const { loadingAuth, response } = useAuth();
    const { loadingUser, user } = useUser();

    const navigate = useNavigate();
    const [ body, setBody ] = useState<"sign" | "loading" | "mail">("sign")
    const [ showedPass, setShowedPass ] = useState({
        auth: false,
        reg: false,
        conf: false,
    });

    const formRef = useRef<HTMLDivElement>(null);
    const isTwoAuth = response.success === true && response.form === "auth" && response.two_auth
    const notTwoAuth = response.success === true && response.form === "auth" && !response.two_auth

    useEffect(() => {
        if (loadingAuth || loadingUser || notTwoAuth) setBody("loading")
        else if (isTwoAuth && !loadingAuth) setBody("mail")
        else setBody("sign")
    }, [isTwoAuth, loadingAuth, loadingUser, notTwoAuth])

    const swipeForm = (targetForm: "auth" | "reg") => {
        if (!formRef.current) return;

        formRef.current.scrollTo({
            left: targetForm === "reg" ? formRef.current.clientWidth : 0,
            behavior: "smooth",
        });
    };

    const showPass = (value: "auth" | "reg" | "conf") => {
        if (value === "auth") setShowedPass({ ...showedPass, auth: !showedPass.auth });
        if (value === "reg") setShowedPass({ ...showedPass, reg: !showedPass.reg });
        if (value === "conf") setShowedPass({ ...showedPass, conf: !showedPass.conf });
    };

    useEffect(() => {
        if (user.id) navigate("/");
    }, [user.id]);

    const selectBody = () => {
        if (body === "sign") return (
            <div
                className="landingFormWrapper"
                ref={formRef}
            > 
                {/* Авторизация */}
                <AuthForm showPass={showPass} showedPass={showedPass} swipeForm={swipeForm}/>
                {/* Регистрация */}
                <RegistrationForm showPass={showPass} showedPass={showedPass} swipeForm={swipeForm}/>
            </div>    
        )
        else if (body === "mail") return <BodyMail/>
        else if (body === "loading") return <Loader/>
    }
    
    return (
        <div className="landing">
            <div className="landingDiv">
                <div className="title">Achieve Together</div>
                {selectBody()}
            </div>
            <LandingFooter />
        </div>
    )
}
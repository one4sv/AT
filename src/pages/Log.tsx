import { useState, useRef, useEffect } from "react";
import "../scss/Landing.scss";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../components/hooks/AuthHook";
import { useUser } from "../components/hooks/UserHook";
import { useNavigate } from "react-router-dom";

export default function Log() {
	const { register, auth, success, loadingAuth } = useAuth();
	const { loadingUser, isAuthenticated } = useUser()
	const [showRules, setShowRules] = useState(false);
	const [checked, setChecked] = useState({
		lengthV: false,
		type: false,
		min: false,
	});
	const [mail, setMail] = useState('');
	const [pass, setPass] = useState('');
	const [nick, setNick] = useState('');
	const [login, setLogin] = useState('');
	const [showedPass, setShowedPass] = useState({
		auth: false,
		reg: false,
		conf: false,
	});

	const navigate = useNavigate()

	const formRef = useRef<HTMLDivElement>(null);
	const authRef = useRef<HTMLInputElement>(null);
	const regRef = useRef<HTMLInputElement>(null);
	const confRef = useRef<HTMLInputElement>(null);
	const hideTimeout = useRef<number | null>(null);

	const swipeForm = (targetForm: "auth" | "reg" | "conf") => {
		if (!formRef.current) return;
		const scrollTarget = targetForm === "reg" ? 1 : 0;
		formRef.current.scrollTo({
			left: scrollTarget * formRef.current.clientWidth,
			behavior: "smooth",
		});
	};

	const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (e.currentTarget.checkValidity() &&
		// checked.lengthV && 
		// checked.type && 
		// checked.min && 
		regRef.current?.value === confRef.current?.value) {
			await register({ mail, pass, nick });
			console.log("Registering with:", { mail, pass, nick });
		}
		if (success) {
			swipeForm("conf");
			console.log("Success:", success);
		}
	};

	const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (e.currentTarget.checkValidity()) {
			await auth({ login, pass });
		}
	};

	const checkPass = (value: string) => {
		const lengthV = value.length >= 8 && value.length <= 30;
		const type = /^[A-Za-z\d]+$/.test(value);
		const min = /[A-Za-z]/.test(value) && /\d/.test(value);
		setChecked({ lengthV, type, min });
	};

	const showPass = (value: "auth" | "reg" | "conf") => {
		if (value === "auth") {
			setShowedPass({ ...showedPass, auth: !showedPass.auth });
			authRef.current?.focus();
		} else if (value === "reg") {
			setShowedPass({ ...showedPass, reg: !showedPass.reg });
			regRef.current?.focus();
		} else if (value === "conf") {
			setShowedPass({ ...showedPass, conf: !showedPass.conf });
			confRef.current?.focus();
		}
	};

	const handleFocus = () => {
		if (hideTimeout.current) {
			clearTimeout(hideTimeout.current);
			hideTimeout.current = null;
		}
		setShowRules(true);
	};

	const handleBlur = () => {
		hideTimeout.current = window.setTimeout(() => {
			setShowRules(false);
			hideTimeout.current = null;
		}, 200);
	};

	const handleMouseEnter = () => {
		if (hideTimeout.current) {
			clearTimeout(hideTimeout.current);
			hideTimeout.current = null;
		}
		setShowRules(true);
	};

	const handleMouseLeave = () => {
		hideTimeout.current = window.setTimeout(() => {
			setShowRules(false);
			hideTimeout.current = null;
		}, 200);
	};

	useEffect(() => {
		if (isAuthenticated) {
			navigate("/")
		}
		else {
			navigate("/log")
		}
	}, [isAuthenticated])

	return (
		<div className="landing">
			<div className="landingDiv">
				<div className="title">
					Achieve Together
				</div>
				<div className="landingForm" ref={formRef} style={{display: success || (loadingAuth || loadingUser) ? "none" : "flex"}}>
					<form className="landingFormAuth" onSubmit={handleAuth} >
						<input
							type="text"
							className="inpLand"
							placeholder="Email или nickname:"
							required
							onInput={(e) => setLogin(e.currentTarget.value)}
						/>
						<div className="passWrap">
							<input
								type={showedPass.auth ? "text" : "password"}
								className="inpLand"
								placeholder="Пароль:"
								// pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,30}$"
								ref={authRef}
								required
								onInput={(e) => setPass(e.currentTarget.value)}

							/>
							{showedPass.auth ? (
								<Eye onClick={() => showPass("auth")} />
								) : (
								<EyeOff onClick={() => showPass("auth")} />
							)}
						</div>
						<div className="landingButts">
							<button type="submit" className="whiteButt">Войти</button>
							<a href="" className="wtbgButt">Забыли пароль?</a>
						</div>
						<button type="button" onClick={() => swipeForm("reg")}>
							Создать аккаунт
						</button>
					</form>
					<form className="landingFormReg" onSubmit={handleRegister}>
						<input type="text" className="inpLand" placeholder="Nickname:" onInput={(e) => setNick(e.currentTarget.value)} required/>
						<input type="text" className="inpLand" placeholder="Email:" onInput={(e) => setMail(e.currentTarget.value)} required/>
						<div
							className={`passWrap ${showRules ? "showRules" : ""}`}
							onFocus={handleMouseEnter}
							onBlur={handleMouseLeave}
						>
							<input
								type={showedPass.reg ? "text" : "password"}
								className="inpLand"
								placeholder="Пароль:"
								ref={regRef}
								onFocus={handleFocus}
								onBlur={handleBlur}
								// pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,30}$"
								required
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									checkPass(e.target.value)
								}
								onInput={(e) => setPass(e.currentTarget.value)}
							/>
							{showedPass.reg ? (
								<Eye
									onClick={() => showPass("reg")}
									onMouseDown={(e) => e.preventDefault()}
								/>
							) : (
								<EyeOff
									onClick={() => showPass("reg")}
									onMouseDown={(e) => e.preventDefault()}
								/>
							)}
							<ul className={`passRules ${showRules ? "active" : ""}`}>
								<li style={{ color: checked.lengthV ? "white" : "#a1a1a1" }}>
									От 8 до 30 символов
								</li>
								<li style={{ color: checked.type ? "white" : "#a1a1a1" }}>
									Цифры и буквы латинского алфавита
								</li>
								<li style={{ color: checked.min ? "white" : "#a1a1a1" }}>
									Минимум 1 цифра и буква
								</li>
							</ul>
						</div>
						<div className="passWrap">
							<input
							type={showedPass.conf ? "text" : "password"}
							className="inpLand"
							placeholder="Повторите пароль:"
							required
							// pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,30}$"
							ref={confRef}
							/>
							{showedPass.conf ? (
								<Eye onClick={() => showPass("conf")} />
								) : (
								<EyeOff onClick={() => showPass("conf")} />
							)}
						</div>
						<div className="landingButts">
							<button type="submit" className="greenButt">
								Создать аккаунт
							</button>
						</div>
						<button type="button" onClick={() => swipeForm("auth")}>
							Войти в аккаунт
						</button>
					</form>
				</div>
				{(loadingAuth || loadingUser) && (
					<div className="loading">
						<div className="loadingPic"></div>
						<span>Секундучку...</span>
					</div>
				)}
				<div className="landingFormConfEmail" style={{display: success ? "flex" : "none"}}>
					<div className="ConfEmailText">
						<span>Проверьте почту.</span>
						<span>Мы отправили вам письмо с ссылкой для входа.</span>
						<button type="button" className="wtbgButt">Отправить письмо повторно.</button>
					</div>
				</div>
			</div>
			<div className="landingFooter">
				<div>
					Achieve Together © 2025
				</div>
				<div>
					<a href="">О нас</a>
					<a href="">Условия</a>
					<a href="">Конфиденциальность</a>
					<span>Русский</span>
				</div>
			</div>
		</div>
	);
}

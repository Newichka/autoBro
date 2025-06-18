import React from 'react';

const ContactPage: React.FC = () => {
  return (
    <div className="contact-page py-5">
      <div className="container">
        <h1 className="text-center mb-5">Контакты</h1>
        <div className="row mb-5">
          <div className="col-md-6">
            <h2 className="mb-3">Свяжитесь с нами</h2>
            <p className="lead">Мы всегда рады ответить на ваши вопросы и помочь с выбором автомобиля.</p>
            <div className="mb-3">
              <i className="bi bi-envelope-at me-2"></i>
              <a href="mailto:support@autobro.ru">support@autobro.ru</a>
            </div>
            <div className="mb-3">
              <i className="bi bi-telephone me-2"></i>
              <a href="tel:+78005553535">8 800 555-35-35</a>
            </div>
            <div className="mb-3">
              <i className="bi bi-geo-alt me-2"></i>
              <span>г. Екатеринбург, пер. Еловский, д. 38</span>
            </div>
          </div>
          <div className="col-md-6">
            <form className="card border-0 shadow-sm p-4">
              <h3 className="mb-3">Обратная связь</h3>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Имя</label>
                <input type="text" className="form-control" id="name" placeholder="Введите ваше имя" />
              </div>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input type="email" className="form-control" id="email" placeholder="Введите ваш email" />
              </div>
              <div className="mb-3">
                <label htmlFor="message" className="form-label">Сообщение</label>
                <textarea className="form-control" id="message" rows={4} placeholder="Введите ваше сообщение"></textarea>
              </div>
              <button type="submit" className="btn btn-primary">Отправить</button>
            </form>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <h2 className="text-center mb-4">Наше местоположение</h2>
            <div className="card border-0 shadow-sm">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d770.073187052598!2d60.60460444285456!3d56.912885305511544!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x43c1726a2fe3a021%3A0xe5a714a02f8b035d!2z0JXQu9C-0LLRgdC60LjQuSDQv9C10YAuLCAzOCwg0JXQutCw0YLQtdGA0LjQvdCx0YPRgNCzLCDQodCy0LXRgNC00LvQvtCy0YHQutCw0Y8g0L7QsdC7LiwgNjIwMDk4!5e0!3m2!1sru!2sru!4v1750258221779!5m2!1sru!2sru" 
                width="100%" 
                height="450" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage; 
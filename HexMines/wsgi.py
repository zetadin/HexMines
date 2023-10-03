"""
WSGI config for HexMines project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'HexMines.settings')

application = get_wsgi_application()


# # workaround to set env vars in apache configs
# # from: https://stackoverflow.com/questions/26979579/django-mod-wsgi-set-os-environment-variable-from-apaches-setenv/26989936
# import django
# from django.core.handlers.wsgi import WSGIHandler

# class WSGIEnvironment(WSGIHandler):

#     def __call__(self, environ, start_response):

#         print(environ)
#         os.environ['DJANGO_DEBUG'] = environ['DJANGO_DEBUG']
#         os.environ['DJANGO_SECRET_KEY'] = environ['DJANGO_SECRET_KEY']
#         os.environ['DJANGO_ALLOWED_HOSTS'] = environ['DJANGO_ALLOWED_HOSTS']
#         os.environ.setdefault("DJANGO_SETTINGS_MODULE", "HexMines.settings")
#         print( os.environ['DJANGO_DEBUG'] )
#         django.setup()
#         return super(WSGIEnvironment, self).__call__(environ, start_response)

# application = WSGIEnvironment()
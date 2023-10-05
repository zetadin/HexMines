from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout, get_user_model
from django.contrib import messages
from django.http import HttpResponse
from django.template import loader
from django.template.loader import render_to_string
from django.contrib.sites.shortcuts import get_current_site
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import EmailMessage


def minefield_view(request):
    template = loader.get_template('minefield.html')
    context={}
    return HttpResponse(template.render(context, request))

def privacy_view(request):
    template = loader.get_template('privacy.html')
    context={}
    return HttpResponse(template.render(context, request))
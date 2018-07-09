# Generated by Django 2.0.7 on 2018-07-09 09:10

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Student',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('full_name', models.CharField(max_length=100)),
                ('student_ticket_number', models.CharField(max_length=8)),
                ('date_of_birth', models.DateField()),
                ('form_of_study', models.CharField(choices=[('EXT', 'external'), ('FUL', 'full-time')], max_length=3)),
                ('educational_degree', models.CharField(choices=[('MAS', 'master'), ('BAC', 'bachelor')], max_length=3)),
                ('year', models.CharField(choices=[('y1', '1'), ('y2', '2'), ('y3', '3'), ('y4', '4')], max_length=3)),
                ('structural_unit', models.CharField(choices=[('REX', 'Faculty of radio-physics, electronics and computer systems')], max_length=3)),
                ('specialty', models.CharField(max_length=100)),
            ],
        ),
    ]